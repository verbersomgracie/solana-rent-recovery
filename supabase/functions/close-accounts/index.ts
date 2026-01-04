import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOLANA_RPC_URL = Deno.env.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
const PLATFORM_FEE_WALLET = Deno.env.get('PLATFORM_FEE_WALLET');
const PLATFORM_FEE_PERCENT = 5;

// Metaplex Token Metadata Program ID
const METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

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

// Base58 alphabet
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Decode base58 to bytes
function decodeBase58(encoded: string): Uint8Array {
  const result: number[] = [];
  for (const char of encoded) {
    let carry = BASE58_ALPHABET.indexOf(char);
    if (carry === -1) throw new Error('Invalid base58 character');
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
  // Add leading zeros
  for (const char of encoded) {
    if (char !== '1') break;
    result.push(0);
  }
  return new Uint8Array(result.reverse());
}

// Encode bytes to base58
function encodeBase58(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  // Add leading zeros
  for (const byte of bytes) {
    if (byte !== 0) break;
    digits.push(0);
  }
  return digits.reverse().map(d => BASE58_ALPHABET[d]).join('');
}

// Derive metadata PDA for a mint
function getMetadataPDA(mint: string): string {
  const mintBytes = decodeBase58(mint);
  const programIdBytes = decodeBase58(METADATA_PROGRAM_ID);
  const prefix = new TextEncoder().encode('metadata');
  
  // Seeds: ["metadata", program_id, mint]
  // We'll use a simplified approach - fetch account info directly
  // The PDA is: sha256(["metadata", metadata_program, mint, 255])
  
  // For simplicity, we'll construct it using known derivation
  const seeds = [
    prefix,
    programIdBytes,
    mintBytes
  ];
  
  // Find PDA by trying bump seeds
  for (let bump = 255; bump >= 0; bump--) {
    try {
      const seedsWithBump = [...seeds, new Uint8Array([bump])];
      const combined = new Uint8Array(
        seedsWithBump.reduce((acc, s) => acc + s.length, 0) + programIdBytes.length + 1
      );
      
      let offset = 0;
      for (const seed of seedsWithBump) {
        combined.set(seed, offset);
        offset += seed.length;
      }
      combined.set(programIdBytes, offset);
      offset += programIdBytes.length;
      combined[offset] = 'ProgramDerivedAddress'.length;
      
      // We can't easily compute SHA256 in Deno without crypto
      // So we'll use the RPC to get metadata directly
      break;
    } catch {
      continue;
    }
  }
  
  return mint; // Return mint as fallback, we'll fetch metadata differently
}

// Fetch NFT metadata from URI
async function fetchNFTMetadata(uri: string): Promise<NFTMetadata | null> {
  try {
    // Handle IPFS URIs
    let fetchUri = uri;
    if (uri.startsWith('ipfs://')) {
      fetchUri = `https://ipfs.io/ipfs/${uri.slice(7)}`;
    } else if (uri.includes('arweave.net')) {
      // Arweave URIs work as-is
    }
    
    const response = await fetch(fetchUri, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    let imageUrl = data.image || data.image_url || '';
    
    // Convert IPFS image URLs
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
    }
    
    return {
      name: data.name || 'Unknown NFT',
      symbol: data.symbol || '',
      image: imageUrl,
      uri: uri
    };
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

// Get on-chain metadata for a mint
async function getOnChainMetadata(mint: string): Promise<{ name: string; uri: string } | null> {
  try {
    // Use DAS API if available, otherwise try getAsset
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

// Fetch token accounts for a wallet (including NFTs)
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
      
      // Include:
      // 1. Accounts with 0 balance (closable empty token accounts)
      // 2. NFTs (decimals = 0, amount = 1) - these can be burned
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
    }
  }

  console.log(`Found ${accounts.length} closable/burnable accounts`);
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

// Build burn instruction for NFT
function buildBurnInstruction(
  tokenAccount: string,
  mint: string,
  owner: string,
  amount: number
): {
  programId: string;
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: number[];
} {
  // Burn instruction index is 8 in Token Program
  const data = new Uint8Array(9);
  data[0] = 8; // Burn instruction
  const view = new DataView(data.buffer);
  view.setBigUint64(1, BigInt(amount), true);
  
  return {
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    keys: [
      { pubkey: tokenAccount, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false }
    ],
    data: Array.from(data)
  };
}

// Build close account instruction
function buildCloseAccountInstruction(
  tokenAccount: string,
  destination: string,
  owner: string
): {
  programId: string;
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: number[];
} {
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
  const data = new Uint8Array(12);
  const view = new DataView(data.buffer);
  view.setUint32(0, 2, true); // Transfer instruction index
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
      const accounts = await getTokenAccounts(walletAddress);
      
      // Fetch metadata for NFTs in parallel
      const accountsWithMetadata = await Promise.all(
        accounts.map(async (acc) => {
          const isNFT = acc.decimals === 0 && acc.amount === '1';
          let metadata: NFTMetadata | null = null;
          let name = isNFT ? 'NFT' : 'Token Account';
          let image = '';
          
          if (isNFT) {
            // Try to get on-chain metadata first
            const onChainMeta = await getOnChainMetadata(acc.mint);
            if (onChainMeta?.uri) {
              metadata = await fetchNFTMetadata(onChainMeta.uri);
              if (metadata) {
                name = metadata.name;
                image = metadata.image;
              } else {
                name = onChainMeta.name || 'NFT';
              }
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
      const platformFeeLamports = Math.floor(totalRentLamports * (PLATFORM_FEE_PERCENT / 100));
      const netAmountLamports = totalRentLamports - platformFeeLamports;

      const nftCount = accountsWithMetadata.filter(a => a.type === 'nft').length;
      const tokenCount = accountsWithMetadata.filter(a => a.type === 'token').length;
      
      console.log(`Found ${nftCount} NFTs and ${tokenCount} empty token accounts`);

      return new Response(JSON.stringify({
        success: true,
        accounts: accountsWithMetadata,
        summary: {
          totalAccounts: accounts.length,
          nftCount,
          tokenCount,
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

      const allAccounts = await getTokenAccounts(walletAddress);
      const selectedAccounts = allAccounts.filter(acc => 
        accountsToClose.includes(acc.pubkey)
      );

      if (selectedAccounts.length === 0) {
        throw new Error('No valid accounts found to close');
      }

      const totalRentLamports = selectedAccounts.reduce((sum, acc) => sum + acc.lamports, 0);
      const platformFeeLamports = Math.floor(totalRentLamports * (PLATFORM_FEE_PERCENT / 100));

      const { blockhash, lastValidBlockHeight } = await getRecentBlockhash();

      const instructions = [];

      for (const account of selectedAccounts) {
        const isNFT = account.decimals === 0 && account.amount === '1';
        
        if (isNFT) {
          // First burn the NFT, then close the account
          instructions.push(buildBurnInstruction(
            account.pubkey,
            account.mint,
            walletAddress,
            1
          ));
        }
        
        // Close the account to recover rent
        instructions.push(buildCloseAccountInstruction(
          account.pubkey,
          walletAddress,
          walletAddress
        ));
      }

      // Add platform fee transfer
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
