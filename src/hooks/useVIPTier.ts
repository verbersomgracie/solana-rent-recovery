// VIP Tier System - Determines fee reduction based on user level and total SOL recovered

export interface VIPTier {
  name: string;
  minLevel: number;
  minSol: number;
  fee: number;
  icon: string;
  color: string;
  benefits: string[];
}

export const VIP_TIERS: VIPTier[] = [
  {
    name: "Bronze",
    minLevel: 1,
    minSol: 0,
    fee: 5.0,
    icon: "Star",
    color: "from-amber-700 to-amber-900",
    benefits: ["Acesso básico", "Conquistas padrão"]
  },
  {
    name: "Prata",
    minLevel: 5,
    minSol: 5,
    fee: 4.5,
    icon: "Shield",
    color: "from-gray-400 to-gray-600",
    benefits: ["Taxa reduzida 4.5%", "Badge exclusivo", "Suporte prioritário"]
  },
  {
    name: "Ouro",
    minLevel: 10,
    minSol: 25,
    fee: 4.0,
    icon: "Crown",
    color: "from-yellow-400 to-amber-600",
    benefits: ["Taxa reduzida 4%", "XP +10%", "Acesso antecipado"]
  },
  {
    name: "Platina",
    minLevel: 20,
    minSol: 100,
    fee: 3.5,
    icon: "Flame",
    color: "from-cyan-400 to-blue-600",
    benefits: ["Taxa reduzida 3.5%", "XP +20%", "NFT exclusivo"]
  },
  {
    name: "Diamante",
    minLevel: 50,
    minSol: 500,
    fee: 3.0,
    icon: "Diamond",
    color: "from-purple-400 to-pink-600",
    benefits: ["Taxa mínima 3%", "XP +30%", "Acesso VIP", "Sorteios especiais"]
  }
];

export const getVIPTier = (currentLevel: number, totalSolRecovered: number): VIPTier => {
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    const tier = VIP_TIERS[i];
    if (currentLevel >= tier.minLevel && totalSolRecovered >= tier.minSol) {
      return tier;
    }
  }
  return VIP_TIERS[0];
};

export const getVIPTierIndex = (currentLevel: number, totalSolRecovered: number): number => {
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    const tier = VIP_TIERS[i];
    if (currentLevel >= tier.minLevel && totalSolRecovered >= tier.minSol) {
      return i;
    }
  }
  return 0;
};

export const getVIPFee = (currentLevel: number, totalSolRecovered: number): number => {
  const tier = getVIPTier(currentLevel, totalSolRecovered);
  return tier.fee;
};

export const getNextVIPTier = (currentLevel: number, totalSolRecovered: number): VIPTier | null => {
  const currentIndex = getVIPTierIndex(currentLevel, totalSolRecovered);
  if (currentIndex < VIP_TIERS.length - 1) {
    return VIP_TIERS[currentIndex + 1];
  }
  return null;
};
