import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOLANA_RPC_URL = Deno.env.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
const PLATFORM_FEE_WALLET = Deno.env.get('PLATFORM_FEE_WALLET');
const PLATFORM_FEE_PERCENT = 5;

interface TokenAccount {
  pubkey: string;
  lamports: number;
  mint: string;
  amount: string;
}

interface CloseAccountRequest {
  walletAddress: string;
  action: 'scan' | 'build-transaction';
  accountsToClose?: string[];
}

// Fetch token accounts for a wallet
async function getTokenAccounts(walletAddress: string): Promise<TokenAccount[]> {
  console.log(`Scanning token accounts for wallet: ${walletAddress}`);
  
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        walletAddress,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' }
      ]
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('RPC Error:', data.error);
    throw new Error(`RPC Error: ${data.error.message}`);
  }

  const accounts: TokenAccount[] = [];
  
  if (data.result?.value) {
    for (const account of data.result.value) {
      const info = account.account.data.parsed.info;
      const tokenAmount = info.tokenAmount;
      
      // Only include accounts with 0 balance (closable)
      if (tokenAmount.uiAmount === 0 || tokenAmount.amount === '0') {
        accounts.push({
          pubkey: account.pubkey,
          lamports: account.account.lamports,
          mint: info.mint,
          amount: tokenAmount.amount
        });
      }
    }
  }

  console.log(`Found ${accounts.length} closable token accounts`);
  return accounts;
}

// Get recent blockhash
async function getRecentBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getLatestBlockhash',
      params: [{ commitment: 'finalized' }]
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`);
  }

  return {
    blockhash: data.result.value.blockhash,
    lastValidBlockHeight: data.result.value.lastValidBlockHeight
  };
}

// Build close account instructions data
function buildCloseAccountInstruction(
  tokenAccount: string,
  destination: string,
  owner: string
): {
  programId: string;
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: number[];
} {
  // CloseAccount instruction index is 9 in Token Program
  return {
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    keys: [
      { pubkey: tokenAccount, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false }
    ],
    data: [9] // CloseAccount instruction discriminator
  };
}

// Build transfer instruction for platform fee
function buildTransferInstruction(
  from: string,
  to: string,
  lamports: number
): {
  programId: string;
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: number[];
} {
  // System Program transfer instruction
  const data = new Uint8Array(12);
  const view = new DataView(data.buffer);
  view.setUint32(0, 2, true); // Transfer instruction index
  // Set lamports as u64 little endian
  view.setBigUint64(4, BigInt(lamports), true);
  
  return {
    programId: '11111111111111111111111111111111',
    keys: [
      { pubkey: from, isSigner: true, isWritable: true },
      { pubkey: to, isSigner: false, isWritable: true }
    ],
    data: Array.from(data)
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, action, accountsToClose } = await req.json() as CloseAccountRequest;

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    console.log(`Processing ${action} request for wallet: ${walletAddress}`);

    if (action === 'scan') {
      // Scan for closable accounts
      const accounts = await getTokenAccounts(walletAddress);
      
      const totalRentLamports = accounts.reduce((sum, acc) => sum + acc.lamports, 0);
      const platformFeeLamports = Math.floor(totalRentLamports * (PLATFORM_FEE_PERCENT / 100));
      const netAmountLamports = totalRentLamports - platformFeeLamports;

      return new Response(JSON.stringify({
        success: true,
        accounts: accounts.map(acc => ({
          address: acc.pubkey,
          mint: acc.mint,
          rentLamports: acc.lamports,
          rentSol: acc.lamports / 1e9,
          type: 'token'
        })),
        summary: {
          totalAccounts: accounts.length,
          totalRentLamports,
          totalRentSol: totalRentLamports / 1e9,
          platformFeeLamports,
          platformFeeSol: platformFeeLamports / 1e9,
          platformFeePercent: PLATFORM_FEE_PERCENT,
          netAmountLamports,
          netAmountSol: netAmountLamports / 1e9,
          feeWallet: PLATFORM_FEE_WALLET
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'build-transaction') {
      if (!accountsToClose || accountsToClose.length === 0) {
        throw new Error('No accounts provided to close');
      }

      if (!PLATFORM_FEE_WALLET) {
        throw new Error('Platform fee wallet not configured');
      }

      // Get all accounts info for calculating fees
      const allAccounts = await getTokenAccounts(walletAddress);
      const selectedAccounts = allAccounts.filter(acc => 
        accountsToClose.includes(acc.pubkey)
      );

      if (selectedAccounts.length === 0) {
        throw new Error('No valid accounts found to close');
      }

      const totalRentLamports = selectedAccounts.reduce((sum, acc) => sum + acc.lamports, 0);
      const platformFeeLamports = Math.floor(totalRentLamports * (PLATFORM_FEE_PERCENT / 100));

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await getRecentBlockhash();

      // Build instructions
      const instructions = [];

      // Add close account instructions (rent goes to wallet owner)
      for (const account of selectedAccounts) {
        instructions.push(buildCloseAccountInstruction(
          account.pubkey,
          walletAddress,
          walletAddress
        ));
      }

      // Add platform fee transfer instruction
      if (platformFeeLamports > 0) {
        instructions.push(buildTransferInstruction(
          walletAddress,
          PLATFORM_FEE_WALLET,
          platformFeeLamports
        ));
      }

      console.log(`Built transaction with ${instructions.length} instructions`);
      console.log(`Total rent: ${totalRentLamports} lamports, Fee: ${platformFeeLamports} lamports`);

      return new Response(JSON.stringify({
        success: true,
        transaction: {
          recentBlockhash: blockhash,
          lastValidBlockHeight,
          feePayer: walletAddress,
          instructions
        },
        summary: {
          accountsClosed: selectedAccounts.length,
          totalRentLamports,
          totalRentSol: totalRentLamports / 1e9,
          platformFeeLamports,
          platformFeeSol: platformFeeLamports / 1e9,
          netAmountLamports: totalRentLamports - platformFeeLamports,
          netAmountSol: (totalRentLamports - platformFeeLamports) / 1e9,
          feeWallet: PLATFORM_FEE_WALLET
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Invalid action: ${action}`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in close-accounts function:', errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
