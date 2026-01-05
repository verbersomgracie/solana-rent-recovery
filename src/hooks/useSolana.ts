import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram
} from '@solana/web3.js';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { supabase } from '@/integrations/supabase/client';

// WalletConnect Project ID
const WALLETCONNECT_PROJECT_ID = 'dac06fba7358042191ac31b82ee8a3e5';

// RPC Endpoint
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: PublicKey | null;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage?: (message: Uint8Array, display?: 'utf8' | 'hex') => Promise<any>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
}

interface SolflareProvider {
  isSolflare: boolean;
  publicKey: PublicKey | null;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage?: (message: Uint8Array, display?: 'utf8' | 'hex') => Promise<any>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
}

interface BackpackProvider {
  isBackpack: boolean;
  publicKey: PublicKey | null;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage?: (message: Uint8Array, display?: 'utf8' | 'hex') => Promise<any>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
}

export interface ScannedAccount {
  address: string;
  mint: string;
  rentLamports: number;
  rentSol: number;
  type: 'token' | 'nft' | 'empty';
  name?: string;
  image?: string;
}

interface ScanResult {
  accounts: ScannedAccount[];
  summary: {
    totalAccounts: number;
    totalRentSol: number;
    platformFeeSol: number;
    platformFeePercent: number;
    netAmountSol: number;
    feeWallet: string;
  };
}

interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider };
    solflare?: SolflareProvider;
    backpack?: BackpackProvider;
  }
}

export function useSolana() {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Store WalletConnect adapter instance
  const walletConnectRef = useRef<WalletConnectWalletAdapter | null>(null);

  const getProvider = useCallback((wallet: string) => {
    switch (wallet.toLowerCase()) {
      case 'phantom':
        return window.phantom?.solana;
      case 'solflare':
        return window.solflare;
      case 'backpack':
        return window.backpack;
      default:
        return null;
    }
  }, []);

  const createWalletConnectAdapter = useCallback(() => {
    return new WalletConnectWalletAdapter({
      network: WalletAdapterNetwork.Mainnet,
      options: {
        relayUrl: 'wss://relay.walletconnect.com',
        projectId: WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: 'SOL Reclaim',
          description: 'Recupere SOL de contas token vazias',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        }
      }
    });
  }, []);

  const requestWalletPermission = useCallback(async (wallet: string, provider: any, pubKey: string) => {
    // If the wallet supports message signing, require a signature so the user always
    // sees an explicit permission/approval prompt (even if the site was trusted before).
    if (typeof provider?.signMessage !== 'function') return true;

    const nonce =
      (globalThis.crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const message = [
      'SOL Reclaim - confirmação de acesso',
      `Wallet: ${pubKey}`,
      `Nonce: ${nonce}`,
      `Domain: ${window.location.host}`,
    ].join('\n');

    try {
      toast.info('Confirme a assinatura na sua wallet...');
      const encoded = new TextEncoder().encode(message);
      await provider.signMessage(encoded, 'utf8');
      return true;
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('reject')) {
        toast.error('Assinatura cancelada pelo usuário');
      } else {
        toast.error('Não foi possível confirmar a wallet', {
          description: msg || 'Tente novamente',
        });
      }
      return false;
    }
  }, []);

  const connect = useCallback(async (wallet: string): Promise<boolean> => {
    setIsConnecting(true);
    try {
      // Handle WalletConnect separately
      if (wallet.toLowerCase() === 'walletconnect') {
        const adapter = createWalletConnectAdapter();
        walletConnectRef.current = adapter;
        
        await adapter.connect();
        
        if (adapter.publicKey) {
          const pubKey = adapter.publicKey.toString();
          setPublicKey(pubKey);
          setIsConnected(true);
          setWalletName('WalletConnect');
          
          toast.success('Wallet conectada via WalletConnect!', {
            description: `${pubKey.slice(0, 8)}...${pubKey.slice(-8)}`
          });
          
          return true;
        }
        return false;
      }

      // Handle other wallets (Phantom, Solflare, Backpack)
      const provider = getProvider(wallet);
      
      if (!provider) {
        toast.error(`${wallet} não está instalada`, {
          description: 'Por favor, instale a extensão da wallet.'
        });
        return false;
      }

      // Ensure we are not silently reusing a previous connection.
      // Disconnecting first helps force the wallet to show its UI again.
      if ((provider as any).publicKey) {
        try {
          await (provider as any).disconnect();
        } catch {
          // ignore
        }
      }

      let response: any;
      try {
        response = await (provider as any).connect({ onlyIfTrusted: false });
      } catch {
        response = await (provider as any).connect();
      }

      const pubKey = response.publicKey.toString();

      const permitted = await requestWalletPermission(wallet, provider, pubKey);
      if (!permitted) {
        return false;
      }
      
      setPublicKey(pubKey);
      setIsConnected(true);
      setWalletName(wallet);
      
      toast.success(`${wallet} conectada!`, {
        description: `${pubKey.slice(0, 8)}...${pubKey.slice(-8)}`
      });
      
      return true;
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error('Erro ao conectar wallet', {
        description: error.message || 'Tente novamente'
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [getProvider, createWalletConnectAdapter, requestWalletPermission]);

  const disconnect = useCallback(async () => {
    // Handle WalletConnect disconnect
    if (walletName === 'WalletConnect' && walletConnectRef.current) {
      try {
        await walletConnectRef.current.disconnect();
        walletConnectRef.current = null;
      } catch (error) {
        console.error('WalletConnect disconnect error:', error);
      }
    } else if (walletName) {
      const provider = getProvider(walletName);
      if (provider) {
        try {
          await provider.disconnect();
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }
    }
    
    setIsConnected(false);
    setPublicKey(null);
    setWalletName(null);
    toast.info('Wallet desconectada');
  }, [walletName, getProvider]);

  const scanAccounts = useCallback(async (): Promise<ScanResult | null> => {
    if (!publicKey) {
      toast.error('Conecte sua wallet primeiro');
      return null;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('close-accounts', {
        body: {
          walletAddress: publicKey,
          action: 'scan'
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Use names from the edge function (includes NFT metadata)
      const accounts: ScannedAccount[] = data.accounts.map((acc: ScannedAccount, index: number) => ({
        ...acc,
        name: acc.name || (acc.type === 'nft' ? `NFT #${index + 1}` : `Token Account #${index + 1}`)
      }));

      const nftCount = accounts.filter(a => a.type === 'nft').length;
      const tokenCount = accounts.filter(a => a.type === 'token').length;
      
      if (nftCount > 0 && tokenCount > 0) {
        toast.success(`${nftCount} NFTs e ${tokenCount} tokens encontrados!`);
      } else if (nftCount > 0) {
        toast.success(`${nftCount} NFTs queimáveis encontrados!`);
      } else {
        toast.success(`${tokenCount} contas token vazias encontradas!`);
      }
      
      return {
        accounts,
        summary: data.summary
      };
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error('Erro ao escanear', {
        description: error.message || 'Tente novamente'
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [publicKey]);

  const logTransaction = useCallback(async (
    walletAddress: string,
    accountsClosed: number,
    solRecovered: number,
    feeCollected: number,
    feePercent: number,
    transactionSignature: string | null
  ) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          wallet_address: walletAddress,
          accounts_closed: accountsClosed,
          sol_recovered: solRecovered,
          fee_collected: feeCollected,
          fee_percent: feePercent,
          transaction_signature: transactionSignature
        });

      if (error) {
        console.error('Error logging transaction:', error);
      } else {
        console.log('Transaction logged successfully');
      }
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  }, []);

  const closeAccounts = useCallback(async (
    accountAddresses: string[]
  ): Promise<TransactionResult> => {
    if (!publicKey || !walletName) {
      return { success: false, error: 'Wallet não conectada' };
    }

    if (accountAddresses.length === 0) {
      return { success: false, error: 'Nenhuma conta selecionada' };
    }

    setIsProcessing(true);
    try {
      // Get transaction data from edge function
      const { data, error } = await supabase.functions.invoke('close-accounts', {
        body: {
          walletAddress: publicKey,
          action: 'build-transaction',
          accountsToClose: accountAddresses
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const { transaction: txData, summary } = data;

      // Build the transaction
      const transaction = new Transaction();
      transaction.recentBlockhash = txData.recentBlockhash;
      transaction.feePayer = new PublicKey(publicKey);

      // Add instructions
      for (const instr of txData.instructions) {
        const instruction = new TransactionInstruction({
          programId: new PublicKey(instr.programId),
          keys: instr.keys.map((key: any) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable
          })),
          data: Buffer.from(instr.data)
        });
        transaction.add(instruction);
      }

      // Get provider and sign/send transaction
      toast.info('Confirme a transação na sua wallet...');
      
      let signature: string;
      
      // Handle WalletConnect separately
      if (walletName === 'WalletConnect' && walletConnectRef.current) {
        const signedTx = await walletConnectRef.current.signTransaction(transaction);
        const connection = new Connection(RPC_ENDPOINT);
        signature = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction(signature);
      } else {
        const provider = getProvider(walletName);
        if (!provider) {
          throw new Error('Wallet provider not found');
        }
        const result = await provider.signAndSendTransaction(transaction);
        signature = result.signature;
      }
      
      // Log transaction to database
      await logTransaction(
        publicKey,
        summary.accountsClosed,
        summary.totalRentSol,
        summary.platformFeeSol,
        summary.platformFeePercent || 5,
        signature
      );
      
      toast.success('SOL recuperado com sucesso!', {
        description: `Você recebeu ${summary.netAmountSol.toFixed(6)} SOL`
      });

      return { 
        success: true, 
        signature 
      };
    } catch (error: any) {
      console.error('Close accounts error:', error);
      
      // Handle user rejection
      if (error.message?.includes('rejected') || error.message?.includes('User rejected')) {
        toast.error('Transação cancelada pelo usuário');
        return { success: false, error: 'Transação cancelada' };
      }
      
      toast.error('Erro ao processar transação', {
        description: error.message || 'Tente novamente'
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [publicKey, walletName, getProvider, logTransaction]);

  return {
    isConnected,
    publicKey,
    walletName,
    isConnecting,
    isScanning,
    isProcessing,
    connect,
    disconnect,
    scanAccounts,
    closeAccounts
  };
}
