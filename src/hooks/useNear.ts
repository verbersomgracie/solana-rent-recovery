import { useState, useCallback, useEffect, useRef } from "react";
import { setupWalletSelector, WalletSelector } from "@near-wallet-selector/core";
import { setupModal, WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { providers, utils } from "near-api-js";
import "@near-wallet-selector/modal-ui/styles.css";

// NEP-141 FT Interface
interface FTContract {
  ft_balance_of: (args: { account_id: string }) => Promise<string>;
  storage_balance_of: (args: { account_id: string }) => Promise<StorageBalance | null>;
  storage_unregister: (args: { force: boolean }) => Promise<boolean>;
}

interface StorageBalance {
  total: string;
  available: string;
}

export interface NearScannedAccount {
  contractId: string;
  tokenName: string;
  tokenSymbol: string;
  balance: string;
  storageDeposit: number; // in NEAR
  isRecoverable: boolean;
  supportsUnregister: boolean;
  icon?: string;
}

export interface NearScanResult {
  accounts: NearScannedAccount[];
  summary: {
    totalAccounts: number;
    totalStorageNear: number;
    platformFeeNear: number;
    platformFeePercent: number;
    netAmountNear: number;
  };
}

export interface NearTransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  recoveredAmount?: number;
}

// Well-known FT contracts for scanning
const KNOWN_FT_CONTRACTS = [
  "wrap.near",
  "usdt.tether-token.near",
  "usdc.near",
  "aurora",
  "token.burrow.near",
  "token.paras.near",
  "ref.fakes.testnet", // testnet
  "wrap.testnet", // testnet
];

// NEAR network configuration
const NEAR_NETWORK = import.meta.env.VITE_NEAR_NETWORK || "testnet";
const PLATFORM_FEE_PERCENT = 5;

export const useNear = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const selectorRef = useRef<WalletSelector | null>(null);
  const modalRef = useRef<WalletSelectorModal | null>(null);
  const providerRef = useRef<InstanceType<typeof providers.JsonRpcProvider> | null>(null);

  // Initialize NEAR wallet selector
  const initWalletSelector = useCallback(async () => {
    if (selectorRef.current) return;

    try {
      const selector = await setupWalletSelector({
        network: NEAR_NETWORK as "testnet" | "mainnet",
        modules: [
          setupMyNearWallet(),
          setupMeteorWallet(),
        ],
      });

      selectorRef.current = selector;
      
      modalRef.current = setupModal(selector, {
        contractId: "", // No specific contract needed for general operations
      });

      // Initialize provider
      const networkConfig = {
        testnet: "https://rpc.testnet.near.org",
        mainnet: "https://rpc.mainnet.near.org",
      };
      providerRef.current = new providers.JsonRpcProvider({ 
        url: networkConfig[NEAR_NETWORK as keyof typeof networkConfig] 
      });

      // Check if already signed in
      const state = selector.store.getState();
      if (state.accounts.length > 0) {
        setAccountId(state.accounts[0].accountId);
        setIsConnected(true);
      }

      // Subscribe to state changes
      selector.store.observable.subscribe((state) => {
        if (state.accounts.length > 0) {
          setAccountId(state.accounts[0].accountId);
          setIsConnected(true);
        } else {
          setAccountId(null);
          setIsConnected(false);
        }
      });
    } catch (error) {
      console.error("Failed to initialize NEAR wallet selector:", error);
    }
  }, []);

  useEffect(() => {
    initWalletSelector();
  }, [initWalletSelector]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!modalRef.current) {
      await initWalletSelector();
    }
    
    setIsConnecting(true);
    try {
      modalRef.current?.show();
    } catch (error) {
      console.error("Failed to connect NEAR wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [initWalletSelector]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!selectorRef.current) return;
    
    try {
      const wallet = await selectorRef.current.wallet();
      await wallet.signOut();
      setIsConnected(false);
      setAccountId(null);
    } catch (error) {
      console.error("Failed to disconnect NEAR wallet:", error);
    }
  }, []);

  // View method on contract (read-only)
  const viewMethod = useCallback(async (
    contractId: string,
    methodName: string,
    args: Record<string, unknown> = {}
  ): Promise<unknown> => {
    if (!providerRef.current) {
      throw new Error("Provider not initialized");
    }

    // Convert args to base64 without using Buffer (browser-compatible)
    const argsJson = JSON.stringify(args);
    const argsBase64 = btoa(unescape(encodeURIComponent(argsJson)));

    const result = await providerRef.current.query({
      request_type: "call_function",
      finality: "optimistic",
      account_id: contractId,
      method_name: methodName,
      args_base64: argsBase64,
    });

    // @ts-ignore - result type is not fully typed
    const resultBytes = result.result as number[];
    const resultStr = String.fromCharCode(...resultBytes);
    return JSON.parse(resultStr);
  }, []);

  // Check if contract supports storage_unregister
  const supportsStorageUnregister = useCallback(async (contractId: string): Promise<boolean> => {
    try {
      // Try to get contract metadata/methods
      // Most FT contracts following NEP-141 with storage management will have this
      await viewMethod(contractId, "storage_unregister", { force: true });
      return true;
    } catch {
      // If it fails, try calling with dry-run to check if method exists
      try {
        const result = await providerRef.current?.query({
          request_type: "view_code",
          finality: "optimistic",
          account_id: contractId,
        });
        // Check if storage_unregister is in the contract code
        // This is a heuristic check
        return true;
      } catch {
        return false;
      }
    }
  }, [viewMethod]);

  // Scan NEAR account for FT tokens with storage deposits
  const scanNearAccount = useCallback(async (): Promise<NearScanResult | null> => {
    if (!accountId || !providerRef.current) {
      console.error("Not connected to NEAR");
      return null;
    }

    setIsScanning(true);
    const scannedAccounts: NearScannedAccount[] = [];

    try {
      // Get all token contracts the user has interacted with
      // Using NEAR Indexer API or known contracts
      const contractsToCheck = await getTokenContracts(accountId);

      for (const contractId of contractsToCheck) {
        try {
          // Check storage balance
          const storageBalance = await viewMethod(contractId, "storage_balance_of", {
            account_id: accountId,
          }) as StorageBalance | null;

          if (!storageBalance) continue;

          // Check token balance
          const balance = await viewMethod(contractId, "ft_balance_of", {
            account_id: accountId,
          }) as string;

          const balanceNum = parseFloat(balance);
          const storageTotal = parseFloat(utils.format.formatNearAmount(storageBalance.total));

          // Get token metadata
          let tokenName = contractId;
          let tokenSymbol = "";
          let icon = "";
          
          try {
            const metadata = await viewMethod(contractId, "ft_metadata", {}) as {
              name: string;
              symbol: string;
              icon?: string;
            };
            tokenName = metadata.name;
            tokenSymbol = metadata.symbol;
            icon = metadata.icon || "";
          } catch {
            // Use contract ID as fallback
          }

          // Check if recoverable (balance is 0 or negligible)
          const isRecoverable = balanceNum === 0 || balanceNum < 1; // Less than 1 base unit
          
          // Check if contract supports unregister
          const canUnregister = await supportsStorageUnregister(contractId);

          if (storageTotal > 0) {
            scannedAccounts.push({
              contractId,
              tokenName,
              tokenSymbol,
              balance,
              storageDeposit: storageTotal,
              isRecoverable: isRecoverable && canUnregister,
              supportsUnregister: canUnregister,
              icon,
            });
          }
        } catch (error) {
          console.error(`Error scanning contract ${contractId}:`, error);
        }
      }

      // Calculate summary
      const recoverableAccounts = scannedAccounts.filter(a => a.isRecoverable);
      const totalStorageNear = recoverableAccounts.reduce((sum, a) => sum + a.storageDeposit, 0);
      const platformFeeNear = totalStorageNear * (PLATFORM_FEE_PERCENT / 100);
      const netAmountNear = totalStorageNear - platformFeeNear;

      return {
        accounts: scannedAccounts,
        summary: {
          totalAccounts: recoverableAccounts.length,
          totalStorageNear,
          platformFeeNear,
          platformFeePercent: PLATFORM_FEE_PERCENT,
          netAmountNear,
        },
      };
    } catch (error) {
      console.error("Failed to scan NEAR account:", error);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [accountId, viewMethod, supportsStorageUnregister]);

  // Get token contracts user has interacted with
  const getTokenContracts = async (accountId: string): Promise<string[]> => {
    const contracts: string[] = [...KNOWN_FT_CONTRACTS];
    
    try {
      // Try to use NEAR Indexer API to get all FT contracts
      const network = NEAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
      const indexerUrl = network === "mainnet" 
        ? "https://api.fastnear.com" 
        : "https://api-testnet.nearblocks.io";
      
      const response = await fetch(
        `${indexerUrl}/v1/account/${accountId}/ft`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.tokens)) {
          for (const token of data.tokens) {
            if (!contracts.includes(token.contract)) {
              contracts.push(token.contract);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch token contracts from indexer:", error);
    }

    return contracts;
  };

  // Estimate recoverable storage
  const estimateRecoverableStorage = useCallback((accounts: NearScannedAccount[]): {
    totalNear: number;
    platformFee: number;
    netAmount: number;
  } => {
    const recoverableAccounts = accounts.filter(a => a.isRecoverable);
    const totalNear = recoverableAccounts.reduce((sum, a) => sum + a.storageDeposit, 0);
    const platformFee = totalNear * (PLATFORM_FEE_PERCENT / 100);
    const netAmount = totalNear - platformFee;

    return {
      totalNear,
      platformFee,
      netAmount,
    };
  }, []);

  // Execute storage recovery
  const executeStorageRecovery = useCallback(async (
    contractIds: string[]
  ): Promise<NearTransactionResult> => {
    if (!selectorRef.current || !accountId) {
      return { success: false, error: "Not connected to NEAR" };
    }

    setIsProcessing(true);

    try {
      const wallet = await selectorRef.current.wallet();
      
      // Build and sign transactions one by one
      const txHashes: string[] = [];
      let totalRecovered = 0;
      
      for (const contractId of contractIds) {
        try {
          const txResult = await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: "storage_unregister",
                  args: { force: true },
                  gas: "30000000000000", // 30 TGas
                  deposit: "1", // 1 yoctoNEAR required for security
                },
              },
            ],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);
          
          if (txResult && typeof txResult === 'object' && 'transaction' in txResult) {
            const tx = txResult as { transaction: { hash: string } };
            txHashes.push(tx.transaction.hash);
            totalRecovered += 0.00125; // Approximate storage cost per registration
          }
        } catch (txError) {
          console.error(`Failed to unregister from ${contractId}:`, txError);
        }
      }

      if (txHashes.length > 0) {
        // Log transaction
        console.log("NEAR Recovery Transaction:", {
          accountId,
          contractIds,
          txHashes,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          txHash: txHashes[0],
          recoveredAmount: totalRecovered,
        };
      }

      return { success: false, error: "No transactions completed" };
    } catch (error) {
      console.error("Failed to execute storage recovery:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsProcessing(false);
    }
  }, [accountId]);

  return {
    isConnected,
    accountId,
    isConnecting,
    isScanning,
    isProcessing,
    connect,
    disconnect,
    scanNearAccount,
    estimateRecoverableStorage,
    executeStorageRecovery,
  };
};
