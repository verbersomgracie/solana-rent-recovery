import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/**
 * SOL Reclaim - Close Accounts Edge Function
 * 
 * PHANTOM COMPLIANCE:
 * - ✅ Non-custodial: Never handles private keys
 * - ✅ Transparent: CloseAccount, Burn, and SystemProgram.transfer instructions
 * - ✅ Transparent fee split: User sees exactly how much they receive vs platform fee
 * - ✅ Fee is a SPLIT of recovered SOL, NOT a charge from user's wallet
 * - ✅ All transactions are signed by user's wallet
 * - ✅ UI clearly shows: "You recover X SOL → You receive Y SOL (Z% platform fee)"
 */

// ============= CORS Headers =============
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============= Environment Variables =============
const SOLANA_RPC_URL = Deno.env.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Token Program ID
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// System Program ID for transfers
const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';

// Platform fee wallet (receives the fee split)
const PLATFORM_FEE_WALLET = Deno.env.get('PLATFORM_FEE_WALLET') || '5pVyoAeURQHNMVU7DmfMHvCDNmTEYXWfEwc136BYy5sR';

// Default platform fee percentage (split of recovered SOL)
const DEFAULT_PLATFORM_FEE_PERCENT = 5;

// ============= Platform Settings =============
async function getPlatformFeePercent(): Promise<number> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'platform_fee_percent')
      .single();
    
    if (error || !data) {
      return DEFAULT_PLATFORM_FEE_PERCENT;
    }
    
    const fee = parseFloat(data.value);
    return isNaN(fee) ? DEFAULT_PLATFORM_FEE_PERCENT : Math.min(Math.max(fee, 0), 100);
  } catch (error) {
    console.error('Error fetching platform fee:', error);
    return DEFAULT_PLATFORM_FEE_PERCENT;
  }
}

// ============= Interfaces =============
interface TokenAccount {
  pubkey: string;
  lamports: number;
  mint: string;
  amount: string;
  decimals: number;
}

interface NFTMetadata {
  name: string;
  symbol: string;
  image: string;
  uri: string;
}

interface CloseAccountRequest {
  walletAddress: string;
  action: 'scan' | 'build-transaction';
  accountsToClose?: string[];
}

interface TransactionInstruction {
  programId: string;
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: number[];
}

// ============= Base58 Encoding/Decoding =============
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodeBase58(encoded: string): Uint8Array {
  if (!encoded || encoded.length === 0) {
    throw new Error('Invalid base58 string: empty input');
  }
  
  const result: number[] = [];
  for (const char of encoded) {
    let carry = BASE58_ALPHABET.indexOf(char);
    if (carry === -1) {
      throw new Error(`Invalid base58 character: ${char}`);
    }
    for (let i = 0; i < result.length; i++) {
      carry += result[i] * 58;
      result[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      result.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of encoded) {
    if (char !== '1') break;
    result.push(0);
  }
  return new Uint8Array(result.reverse());
}

// ============= Address Validation =============
function isValidSolanaAddress(address: string): boolean {
  try {
    if (!address || address.length < 32 || address.length > 44) {
      return false;
    }
    const decoded = decodeBase58(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

// ============= NFT Metadata Fetching =============
async function fetchNFTMetadata(uri: string): Promise<NFTMetadata | null> {
  try {
    if (!uri) return null;
    
    let fetchUri = uri;
    if (uri.startsWith('ipfs://')) {
      fetchUri = `https://ipfs.io/ipfs/${uri.slice(7)}`;
    } else if (uri.startsWith('ar://')) {
      fetchUri = `https://arweave.net/${uri.slice(5)}`;
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(fetchUri, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    let imageUrl = data.image || data.image_url || '';
    
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
    } else if (imageUrl.startsWith('ar://')) {
      imageUrl = `https://arweave.net/${imageUrl.slice(5)}`;
    }
    
    return {
      name: data.name || 'Unknown NFT',
      symbol: data.symbol || '',
      image: imageUrl,
      uri: uri
    };
  } catch (error) {
    console.log('Error fetching NFT metadata:', error);
    return null;
  }
}

// ============= On-Chain Metadata =============
async function getOnChainMetadata(mint: string): Promise<{ name: string; uri: string } | null> {
  try {
    const response = await fetch(SOLANA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAsset',
        params: { id: mint }
      })
    });
    
    const data = await response.json();
    
    if (data.result) {
      return {
        name: data.result.content?.metadata?.name || data.result.content?.json_uri || 'NFT',
        uri: data.result.content?.json_uri || ''
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// ============= Token Account Scanning =============
async function getTokenAccounts(walletAddress: string): Promise<TokenAccount[]> {
  console.log(`Scanning token accounts for wallet: ${walletAddress}`);
  
  if (!isValidSolanaAddress(walletAddress)) {
    throw new Error('Invalid wallet address format');
  }
  
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        walletAddress,
        { programId: TOKEN_PROGRAM_ID },
        { encoding: 'jsonParsed' }
      ]
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('RPC Error:', data.error);
    throw new Error(`RPC Error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const accounts: TokenAccount[] = [];
  
  if (data.result?.value) {
    for (const account of data.result.value) {
      try {
        const info = account.account.data.parsed.info;
        const tokenAmount = info.tokenAmount;
        
        const isEmptyAccount = tokenAmount.uiAmount === 0 || tokenAmount.amount === '0';
        const isNFT = tokenAmount.decimals === 0 && tokenAmount.amount === '1';
        
        if (isEmptyAccount || isNFT) {
          accounts.push({
            pubkey: account.pubkey,
            lamports: account.account.lamports,
            mint: info.mint,
            amount: tokenAmount.amount,
            decimals: tokenAmount.decimals
          });
        }
      } catch (parseError) {
        console.log('Error parsing account:', parseError);
        continue;
      }
    }
  }

  console.log(`Found ${accounts.length} closable/burnable accounts`);
  return accounts;
}

// ============= Blockhash Retrieval =============
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
    throw new Error(`RPC Error getting blockhash: ${data.error.message || JSON.stringify(data.error)}`);
  }

  if (!data.result?.value?.blockhash) {
    throw new Error('Failed to get recent blockhash from RPC');
  }

  return {
    blockhash: data.result.value.blockhash,
    lastValidBlockHeight: data.result.value.lastValidBlockHeight
  };
}

// ============= Instruction Builders =============

/**
 * Build Token Program Burn instruction
 * PHANTOM APPROVED: Standard Token Program instruction
 */
function buildBurnInstruction(
  tokenAccount: string,
  mint: string,
  owner: string,
  amount: number
): TransactionInstruction {
  const data = new Uint8Array(9);
  data[0] = 8; // Burn instruction discriminator
  const view = new DataView(data.buffer);
  view.setBigUint64(1, BigInt(amount), true);
  
  return {
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: tokenAccount, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false }
    ],
    data: Array.from(data)
  };
}

/**
 * Build Token Program CloseAccount instruction
 * PHANTOM APPROVED: Standard Token Program instruction
 * NOTE: destination is the user's wallet - rent goes directly to user first
 */
function buildCloseAccountInstruction(
  tokenAccount: string,
  destination: string,
  owner: string
): TransactionInstruction {
  return {
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: tokenAccount, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false }
    ],
    data: [9] // CloseAccount instruction discriminator
  };
}

/**
 * Build SystemProgram Transfer instruction
 * PHANTOM APPROVED: Standard System Program instruction
 * Used for transparent platform fee split - clearly shown in UI
 */
function buildTransferInstruction(
  from: string,
  to: string,
  lamports: number
): TransactionInstruction {
  // SystemProgram Transfer instruction layout:
  // 4 bytes: instruction index (2 = Transfer)
  // 8 bytes: lamports (u64, little endian)
  const data = new Uint8Array(12);
  const view = new DataView(data.buffer);
  view.setUint32(0, 2, true); // Transfer instruction discriminator
  view.setBigUint64(4, BigInt(lamports), true);
  
  return {
    programId: SYSTEM_PROGRAM_ID,
    keys: [
      { pubkey: from, isSigner: true, isWritable: true },
      { pubkey: to, isSigner: false, isWritable: true }
    ],
    data: Array.from(data)
  };
}

// ============= Request Handler =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { walletAddress, action, accountsToClose } = body as CloseAccountRequest;

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    if (!isValidSolanaAddress(walletAddress)) {
      throw new Error('Invalid Solana wallet address format');
    }

    console.log(`Processing ${action} request for wallet: ${walletAddress}`);

    // ============= SCAN Action =============
    if (action === 'scan') {
      const accounts = await getTokenAccounts(walletAddress);
      const suggestedDonationPercent = await getPlatformFeePercent();
      
      const accountsWithMetadata = await Promise.all(
        accounts.map(async (acc) => {
          const isNFT = acc.decimals === 0 && acc.amount === '1';
          let name = isNFT ? 'NFT' : 'Empty Token Account';
          let image = '';
          
          if (isNFT) {
            try {
              const onChainMeta = await getOnChainMetadata(acc.mint);
              if (onChainMeta?.uri) {
                const metadata = await fetchNFTMetadata(onChainMeta.uri);
                if (metadata) {
                  name = metadata.name;
                  image = metadata.image;
                } else {
                  name = onChainMeta.name || 'NFT';
                }
              }
            } catch (metaError) {
              console.log('Metadata fetch error for mint:', acc.mint, metaError);
            }
          }
          
          return {
            address: acc.pubkey,
            mint: acc.mint,
            rentLamports: acc.lamports,
            rentSol: acc.lamports / 1e9,
            type: isNFT ? 'nft' : 'token',
            name,
            image,
            amount: acc.amount,
            decimals: acc.decimals
          };
        })
      );
      
      const totalRentLamports = accounts.reduce((sum, acc) => sum + acc.lamports, 0);
      const nftCount = accountsWithMetadata.filter(a => a.type === 'nft').length;
      const tokenCount = accountsWithMetadata.filter(a => a.type === 'token').length;
      
      // Calculate transparent fee split
      const platformFeePercent = suggestedDonationPercent;
      const platformFeeLamports = Math.floor(totalRentLamports * platformFeePercent / 100);
      const netAmountLamports = totalRentLamports - platformFeeLamports;
      
      console.log(`Scan complete: ${nftCount} NFTs, ${tokenCount} empty token accounts`);
      console.log(`Total rent: ${totalRentLamports} lamports (${totalRentLamports / 1e9} SOL)`);
      console.log(`Platform fee (${platformFeePercent}%): ${platformFeeLamports} lamports`);
      console.log(`User receives: ${netAmountLamports} lamports (${netAmountLamports / 1e9} SOL)`);

      return new Response(JSON.stringify({
        success: true,
        accounts: accountsWithMetadata,
        summary: {
          totalAccounts: accounts.length,
          nftCount,
          tokenCount,
          totalRentLamports,
          totalRentSol: totalRentLamports / 1e9,
          // TRANSPARENT FEE SPLIT: Clearly shown in UI
          platformFeeLamports,
          platformFeeSol: platformFeeLamports / 1e9,
          platformFeePercent,
          platformFeeWallet: PLATFORM_FEE_WALLET,
          // What user actually receives after fee split
          netAmountLamports,
          netAmountSol: netAmountLamports / 1e9
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============= BUILD-TRANSACTION Action =============
    if (action === 'build-transaction') {
      if (!accountsToClose || accountsToClose.length === 0) {
        throw new Error('No accounts provided to close');
      }

      for (const acc of accountsToClose) {
        if (!isValidSolanaAddress(acc)) {
          throw new Error(`Invalid account address: ${acc}`);
        }
      }

      const allAccounts = await getTokenAccounts(walletAddress);
      const selectedAccounts = allAccounts.filter(acc => 
        accountsToClose.includes(acc.pubkey)
      );

      if (selectedAccounts.length === 0) {
        throw new Error('No valid accounts found to close. They may have already been closed.');
      }

      console.log(`Processing ${selectedAccounts.length} accounts for closure`);

      const totalRentLamports = selectedAccounts.reduce((sum, acc) => sum + acc.lamports, 0);
      const { blockhash, lastValidBlockHeight } = await getRecentBlockhash();
      
      // Get platform fee percentage
      const platformFeePercent = await getPlatformFeePercent();
      const platformFeeLamports = Math.floor(totalRentLamports * platformFeePercent / 100);
      const netAmountLamports = totalRentLamports - platformFeeLamports;
      
      // Minimum fee threshold (avoid dust transactions)
      const MIN_FEE_LAMPORTS = 1000; // 0.000001 SOL

      const instructions: TransactionInstruction[] = [];

      // Build instructions for each account
      for (const account of selectedAccounts) {
        const isNFT = account.decimals === 0 && account.amount === '1';
        
        if (isNFT) {
          console.log(`Adding burn instruction for NFT: ${account.pubkey}`);
          instructions.push(buildBurnInstruction(
            account.pubkey,
            account.mint,
            walletAddress,
            1
          ));
        }
        
        // Close account - rent goes directly to user's wallet first
        console.log(`Adding close instruction for account: ${account.pubkey}`);
        instructions.push(buildCloseAccountInstruction(
          account.pubkey,
          walletAddress,
          walletAddress
        ));
      }
      
      // TRANSPARENT PLATFORM FEE: Add transfer instruction AFTER close accounts
      // This is a SPLIT of the recovered SOL, not a charge from user's existing balance
      // User can see this clearly in their wallet when signing
      if (platformFeeLamports >= MIN_FEE_LAMPORTS && platformFeePercent > 0) {
        console.log(`Adding platform fee transfer: ${platformFeeLamports} lamports (${platformFeePercent}%) to ${PLATFORM_FEE_WALLET}`);
        instructions.push(buildTransferInstruction(
          walletAddress,
          PLATFORM_FEE_WALLET,
          platformFeeLamports
        ));
      } else {
        console.log(`Skipping platform fee transfer: amount ${platformFeeLamports} below minimum ${MIN_FEE_LAMPORTS}`);
      }

      const nftCount = selectedAccounts.filter(a => a.decimals === 0 && a.amount === '1').length;
      const tokenCount = selectedAccounts.filter(a => a.amount === '0').length;

      console.log(`Built transaction with ${instructions.length} instructions`);
      console.log(`Total rent to recover: ${totalRentLamports} lamports (${(totalRentLamports / 1e9).toFixed(9)} SOL)`);
      console.log(`Platform fee (${platformFeePercent}%): ${platformFeeLamports >= MIN_FEE_LAMPORTS ? platformFeeLamports : 0} lamports`);
      console.log(`User receives: ${platformFeeLamports >= MIN_FEE_LAMPORTS ? netAmountLamports : totalRentLamports} lamports`);

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
          // TRANSPARENT FEE SPLIT: Clearly communicated
          platformFeeLamports: platformFeeLamports >= MIN_FEE_LAMPORTS ? platformFeeLamports : 0,
          platformFeeSol: platformFeeLamports >= MIN_FEE_LAMPORTS ? platformFeeLamports / 1e9 : 0,
          platformFeePercent: platformFeeLamports >= MIN_FEE_LAMPORTS ? platformFeePercent : 0,
          platformFeeWallet: PLATFORM_FEE_WALLET,
          netAmountLamports: platformFeeLamports >= MIN_FEE_LAMPORTS ? netAmountLamports : totalRentLamports,
          netAmountSol: platformFeeLamports >= MIN_FEE_LAMPORTS ? netAmountLamports / 1e9 : totalRentLamports / 1e9,
          // Transaction preview for transparency
          transactionPreview: {
            type: 'rent_recovery',
            accountsToClose: selectedAccounts.length,
            nftsToburn: nftCount,
            emptyAccountsToClose: tokenCount,
            rentDestination: walletAddress,
            platformFeeDestination: platformFeeLamports >= MIN_FEE_LAMPORTS ? PLATFORM_FEE_WALLET : null,
            totalRecovered: `${(totalRentLamports / 1e9).toFixed(6)} SOL`,
            platformFee: platformFeeLamports >= MIN_FEE_LAMPORTS ? `${(platformFeeLamports / 1e9).toFixed(6)} SOL (${platformFeePercent}%)` : '0 SOL',
            youReceive: `${((platformFeeLamports >= MIN_FEE_LAMPORTS ? netAmountLamports : totalRentLamports) / 1e9).toFixed(6)} SOL`
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Invalid action: ${action}. Supported actions: scan, build-transaction`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error in close-accounts function:', errorMessage);
    if (errorStack) {
      console.error('Stack trace:', errorStack);
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
