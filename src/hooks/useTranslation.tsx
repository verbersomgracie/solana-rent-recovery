import { useState, useCallback, createContext, useContext, ReactNode } from 'react';

export type Language = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'zh';

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.howItWorks': 'How It Works',
    'nav.fees': 'Fees',
    'nav.faq': 'FAQ',
    'nav.profile': 'Profile',
    'nav.scanner': 'Scanner',
    'nav.navigation': 'Navigation',
    'wallet.connected': 'Connected',
    
    // Wallet
    'wallet.connect': 'Connect Wallet',
    'wallet.disconnect': 'Disconnect',
    
    // Hero
    'hero.badge': 'Recover hidden SOL',
    'hero.title': 'Recover SOL stuck in',
    'hero.titleHighlight': 'Empty Accounts',
    'hero.subtitle': 'Do you have empty token accounts and burned NFTs? Recover the rent paid in SOL with just one click.',
    'hero.cta': 'Start Now',
    'hero.stats.recovered': 'SOL Recovered',
    'hero.stats.users': 'Active Users',
    'hero.stats.accounts': 'Closed Accounts',
    'hero.benefit.noFees': 'No Hidden Fees',
    'hero.benefit.fast': 'Ultra Fast',
    'hero.benefit.secure': '100% Secure',
    'hero.ranking': 'View Ranking',
    
    // Scanner
    'scanner.chooseChain': 'Choose Blockchain',
    'scanner.selectNetwork': 'Select the network to recover your funds',
    'scanner.connectWallet': 'Connect Your Wallet',
    'scanner.connectDesc': 'Connect your Solana wallet to scan your accounts and recover SOL stuck in rent.',
    'scanner.orTest': 'Or test the system',
    'scanner.simulate': 'Simulate Scan',
    'scanner.simulating': 'Simulating...',
    'scanner.scanning': 'Scanning Blockchain',
    'scanner.searchingAccounts': 'Searching for token accounts and NFTs on Solana...',
    'scanner.simulationMode': 'Simulation Mode - Fictitious data for demonstration',
    'scanner.availableToRecover': 'available to recover',
    'scanner.accountsFound': 'Accounts found',
    'scanner.platformFee': 'Platform fee',
    'scanner.feeCharged': 'Fee charged',
    'scanner.vipDiscount': 'VIP Discount',
    'scanner.saving': 'Saving',
    'scanner.youReceive': 'You receive',
    'scanner.recover': 'Recover',
    'scanner.processing': 'Processing...',
    'scanner.confirmTx': 'By clicking, you will confirm the transaction in your wallet',
    'scanner.viewDetails': 'View details of',
    'scanner.accounts': 'accounts',
    'scanner.deselectAll': 'Deselect All',
    'scanner.selectAll': 'Select All',
    'scanner.rescan': 'Re-scan',
    'scanner.allClean': 'All Clean!',
    'scanner.solRecovered': 'SOL Recovered!',
    'scanner.noAccountsFound': "We didn't find any empty accounts or burnable NFTs in your wallet.",
    'scanner.successMessage': 'All accounts were successfully closed and SOL was sent to your wallet!',
    'scanner.viewOnExplorer': 'View on Solana Explorer',
    'scanner.scanAgain': 'Scan Again',
    
    // Profile
    'profile.title': 'Your Profile',
    'profile.subtitle': 'Achievements, statistics and ranking',
    'profile.stats': 'Statistics',
    'profile.achievements': 'Achievements',
    'profile.leaderboard': 'Leaderboard',
    'profile.vip': 'VIP',
    'profile.streak': 'Streak',
    
    // Progress (Sidebar)
    'progress.level': 'Level',
    'progress.stats': 'Statistics',
    'progress.transactions': 'Transactions',
    'progress.achievements': 'Achievements',
    'progress.leaderboard': 'Leaderboard',
    
    // VIP
    'vip.yourLevel': 'Your VIP level',
    'vip.fee': 'fee',
    'vip.next': 'Next',
    'vip.allLevels': 'All VIP levels',
    'vip.current': 'Current',
    
    // Leaderboard
    'leaderboard.title': 'Top Recoverers',
    'leaderboard.you': 'You',
    'leaderboard.level': 'Lvl',
    
    // Referral
    'referral.title': 'Refer Friends',
    'referral.subtitle': 'Share your code and earn rewards',
    'referral.yourCode': 'Your referral code',
    'referral.copied': 'Copied!',
    'referral.copy': 'Copy',
    'referral.invited': 'Friends invited',
    'referral.applyCode': 'Apply referral code',
    'referral.apply': 'Apply',
    'referral.placeholder': 'Enter code',
    
    // Streak
    'streak.title': 'Daily Streak',
    'streak.currentStreak': 'Current streak',
    'streak.days': 'days',
    'streak.bonus': 'Streak bonus',
    'streak.keepStreak': 'Use the platform daily to keep your streak!',
    
    // How It Works
    'how.title': 'How It Works',
    'how.subtitle': 'Recover your SOL in 4 simple steps',
    'how.step1.title': 'Connect Wallet',
    'how.step1.desc': 'Connect your Phantom, Solflare or any compatible wallet securely',
    'how.step2.title': 'Scan Accounts',
    'how.step2.desc': 'Our scanner automatically identifies empty accounts, burnable NFTs and recoverable rent',
    'how.step3.title': 'Select & Burn',
    'how.step3.desc': 'Choose the accounts you want to close. You have full control over what gets processed',
    'how.step4.title': 'Recover SOL',
    'how.step4.desc': 'The rent SOL is recovered and sent to your wallet, minus the platform fee',
    
    // Fees
    'fees.title': 'Transparent Fees',
    'fees.subtitle': 'We only charge a small fee on recovered SOL. No hidden costs.',
    'fees.platformFee': 'Platform Fee',
    'fees.perSolRecovered': 'per SOL recovered',
    'fees.recovered': 'Recovered',
    'fees.fee': 'Fee',
    'fees.secure': '100% Secure',
    'fees.secureDesc': 'We never ask for private keys. Everything is signed by your wallet.',
    'fees.transparent': 'Transparent',
    'fees.transparentDesc': 'All transactions are verifiable on the Solana blockchain.',
    'fees.nonCustodial': 'Non-Custodial',
    'fees.nonCustodialDesc': 'You maintain full control of your funds throughout the process.',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Get your questions answered about SOL Reclaim.',
    'faq.q1': 'What is rent on Solana?',
    'faq.a1': 'Rent is a mandatory fee that Solana charges to keep accounts active on the blockchain. When you create an SPL token account or receive an NFT, a small amount of SOL (usually ~0.002 SOL) is reserved as rent. This amount remains "stuck" until you close the account.',
    'faq.q2': 'What types of accounts can I close?',
    'faq.a2': "You can close: 1) Empty SPL token accounts (tokens you've already transferred), 2) NFTs you no longer want (will be burned), 3) Empty accounts with no purpose. We don't close accounts that still have balance or are necessary for your wallet to function.",
    'faq.q3': 'Is it safe to use this tool?',
    'faq.a3': 'Yes! We never ask for your private keys. All operations are done through transactions that you sign with your own wallet. You have full control and can review each transaction before approving. We are 100% non-custodial.',
    'faq.q4': 'How much does the service cost?',
    'faq.a4': 'We charge 5% on the total SOL recovered. For example, if you recover 0.1 SOL, the fee will be 0.005 SOL. This fee covers the development and maintenance costs of the platform.',
    'faq.q5': 'Can I reverse closing an account?',
    'faq.a5': "No. Closing accounts is an irreversible operation on the Solana blockchain. That's why we show a clear warning before you confirm the transaction. Make sure you want to close the selected accounts.",
    'faq.q6': 'Why do some NFTs appear as "burnable"?',
    'faq.a6': "NFTs appear as burnable when we identify them as spam collections, unwanted airdrops, or when you've explicitly selected them to burn. When you burn an NFT, you recover the rent associated with it.",
    'faq.q7': 'How long does the process take?',
    'faq.a7': 'Scanning takes a few seconds. The closing transaction depends on the number of accounts selected and Solana network congestion, but is usually processed in less than 1 minute.',
    'faq.q8': 'Which wallets are supported?',
    'faq.a8': 'We support the main Solana wallets: Phantom, Solflare, and Backpack. Other wallets compatible with the Solana Wallet Adapter standard may also work.',
    
    // Footer
    'footer.tagline': 'Recover your SOL',
    'footer.rights': 'All rights reserved',
    'footer.builtOn': 'Built on',
    
    // General
    'general.loading': 'Loading...',
    
    // Stats
    'stats.solRecovered': 'SOL Recovered',
    'stats.accountsClosed': 'Accounts Closed',
    
    // VIP Banner
    'vipBanner.badge': 'Loyalty Rewards',
    'vipBanner.title': 'Recurring users get',
    'vipBanner.titleHighlight': 'Lower Fees',
    'vipBanner.subtitle': 'The more you use our platform, the less you pay. Automatic progression system based on your level and total SOL recovered.',
    'vipBanner.level': 'Level',
    'vipBanner.feesFrom': 'Fees from',
    'vipBanner.feesDesc': 'Diamond tier members pay up to 40% less in fees',
    'vipBanner.automatic': 'Automatic Upgrade',
    'vipBanner.automaticDesc': 'Level up by using the platform and earn more XP',
    'vipBanner.exclusive': 'Exclusive Benefits',
    'vipBanner.exclusiveDesc': 'Priority support, exclusive badges and special raffles',
    'vipBanner.cta': 'Start recovering SOL now and',
    'vipBanner.ctaHighlight': 'watch your fees drop automatically!',
    
    // VIP Benefits
    'vip.benefit.basicAccess': 'Basic access',
    'vip.benefit.standardAchievements': 'Standard achievements',
    'vip.benefit.reducedFee45': '4.5% reduced fee',
    'vip.benefit.exclusiveBadge': 'Exclusive badge',
    'vip.benefit.prioritySupport': 'Priority support',
    'vip.benefit.reducedFee40': '4% reduced fee',
    'vip.benefit.xp10': 'XP +10%',
    'vip.benefit.earlyAccess': 'Early access',
    'vip.benefit.reducedFee35': '3.5% reduced fee',
    'vip.benefit.xp20': 'XP +20%',
    'vip.benefit.exclusiveNft': 'Exclusive NFT',
    'vip.benefit.minFee30': '3% minimum fee',
    'vip.benefit.xp30': 'XP +30%',
    'vip.benefit.vipAccess': 'VIP access',
    'vip.benefit.specialRaffles': 'Special raffles',
    
    // VIP Progress
    'vipProgress.title': 'VIP Progress',
    'vipProgress.connectToSee': 'Connect wallet to see your VIP progress',
    'vipProgress.maxTier': 'Max tier reached!',
    'vipProgress.levels': 'levels',
    'vipProgress.toGo': 'to go',
    'vipProgress.levelsToGo': 'levels to go',
    'vipProgress.progress': 'Progress',
    'vipProgress.unlockNext': 'Reach next tier to unlock',
    'vipProgress.lowerFees': 'lower fees',
  },
  
  pt: {
    // Navigation
    'nav.howItWorks': 'Como Funciona',
    'nav.fees': 'Taxas',
    'nav.faq': 'FAQ',
    'nav.profile': 'Perfil',
    'nav.scanner': 'Scanner',
    'nav.navigation': 'Navegação',
    'wallet.connected': 'Conectado',
    
    // Wallet
    'wallet.connect': 'Conectar Wallet',
    'wallet.disconnect': 'Desconectar',
    
    // Hero
    'hero.badge': 'Recupere SOL escondido',
    'hero.title': 'Recupere SOL preso em',
    'hero.titleHighlight': 'Contas Vazias',
    'hero.subtitle': 'Você tem contas de token vazias e NFTs queimados? Recupere o rent pago em SOL com apenas um clique.',
    'hero.cta': 'Começar Agora',
    'hero.stats.recovered': 'SOL Recuperados',
    'hero.stats.users': 'Usuários Ativos',
    'hero.stats.accounts': 'Contas Fechadas',
    'hero.benefit.noFees': 'Sem Taxas Ocultas',
    'hero.benefit.fast': 'Ultra Rápido',
    'hero.benefit.secure': '100% Seguro',
    'hero.ranking': 'Ver Ranking',
    
    // Scanner
    'scanner.chooseChain': 'Escolha a Blockchain',
    'scanner.selectNetwork': 'Selecione a rede para recuperar seus fundos',
    'scanner.connectWallet': 'Conecte sua Wallet',
    'scanner.connectDesc': 'Conecte sua wallet Solana para escanear suas contas e recuperar SOL preso em rent.',
    'scanner.orTest': 'Ou teste o sistema',
    'scanner.simulate': 'Simular Escaneamento',
    'scanner.simulating': 'Simulando...',
    'scanner.scanning': 'Escaneando Blockchain',
    'scanner.searchingAccounts': 'Buscando contas token e NFTs na Solana...',
    'scanner.simulationMode': 'Modo Simulação - Dados fictícios para demonstração',
    'scanner.availableToRecover': 'disponível para recuperar',
    'scanner.accountsFound': 'Contas encontradas',
    'scanner.platformFee': 'Taxa da plataforma',
    'scanner.feeCharged': 'Taxa cobrada',
    'scanner.vipDiscount': 'Desconto VIP',
    'scanner.saving': 'Economizando',
    'scanner.youReceive': 'Você recebe',
    'scanner.recover': 'Recuperar',
    'scanner.processing': 'Processando...',
    'scanner.confirmTx': 'Ao clicar, você confirmará a transação na sua wallet',
    'scanner.viewDetails': 'Ver detalhes das',
    'scanner.accounts': 'contas',
    'scanner.deselectAll': 'Desmarcar Todas',
    'scanner.selectAll': 'Selecionar Todas',
    'scanner.rescan': 'Re-escanear',
    'scanner.allClean': 'Tudo Limpo!',
    'scanner.solRecovered': 'SOL Recuperado!',
    'scanner.noAccountsFound': 'Não encontramos contas vazias ou NFTs queimáveis na sua wallet.',
    'scanner.successMessage': 'Todas as contas foram fechadas com sucesso e o SOL foi enviado para sua wallet!',
    'scanner.viewOnExplorer': 'Ver no Solana Explorer',
    'scanner.scanAgain': 'Escanear Novamente',
    
    // Profile
    'profile.title': 'Seu Perfil',
    'profile.subtitle': 'Conquistas, estatísticas e ranking',
    'profile.stats': 'Estatísticas',
    'profile.achievements': 'Conquistas',
    'profile.leaderboard': 'Ranking',
    'profile.vip': 'VIP',
    'profile.streak': 'Streak',
    
    // Meu Progresso (Sidebar)
    'progress.level': 'Nível',
    'progress.stats': 'Estatísticas',
    'progress.transactions': 'Transações',
    'progress.achievements': 'Conquistas',
    'progress.leaderboard': 'Ranking',
    
    // VIP
    'vip.yourLevel': 'Seu nível VIP',
    'vip.fee': 'taxa',
    'vip.next': 'Próximo',
    'vip.allLevels': 'Todos os níveis VIP',
    'vip.current': 'Atual',
    
    // Leaderboard
    'leaderboard.title': 'Top Recuperadores',
    'leaderboard.you': 'Você',
    'leaderboard.level': 'Lvl',
    
    // Referral
    'referral.title': 'Indique Amigos',
    'referral.subtitle': 'Compartilhe seu código e ganhe recompensas',
    'referral.yourCode': 'Seu código de referência',
    'referral.copied': 'Copiado!',
    'referral.copy': 'Copiar',
    'referral.invited': 'Amigos convidados',
    'referral.applyCode': 'Aplicar código de referência',
    'referral.apply': 'Aplicar',
    'referral.placeholder': 'Digite o código',
    
    // Streak
    'streak.title': 'Streak Diário',
    'streak.currentStreak': 'Streak atual',
    'streak.days': 'dias',
    'streak.bonus': 'Bônus de streak',
    'streak.keepStreak': 'Use a plataforma diariamente para manter seu streak!',
    
    // How It Works
    'how.title': 'Como Funciona',
    'how.subtitle': 'Recupere seu SOL em 4 passos simples',
    'how.step1.title': 'Conecte sua Wallet',
    'how.step1.desc': 'Conecte sua wallet Solana (Phantom, Solflare, Backpack) de forma segura',
    'how.step2.title': 'Escaneie suas Contas',
    'how.step2.desc': 'Nosso scanner identifica automaticamente contas vazias, NFTs queimáveis e rent recuperável',
    'how.step3.title': 'Selecione e Queime',
    'how.step3.desc': 'Escolha as contas que deseja fechar. Você tem controle total sobre o que será processado',
    'how.step4.title': 'Recupere seu SOL',
    'how.step4.desc': 'O SOL de rent é recuperado e enviado para sua wallet, menos a taxa da plataforma',
    
    // Fees
    'fees.title': 'Taxas Transparentes',
    'fees.subtitle': 'Cobramos apenas uma pequena taxa sobre o SOL recuperado. Sem custos ocultos.',
    'fees.platformFee': 'Taxa da Plataforma',
    'fees.perSolRecovered': 'sobre cada SOL recuperado',
    'fees.recovered': 'Recuperado',
    'fees.fee': 'Taxa',
    'fees.secure': '100% Seguro',
    'fees.secureDesc': 'Nunca solicitamos chaves privadas. Tudo é assinado pela sua wallet.',
    'fees.transparent': 'Transparente',
    'fees.transparentDesc': 'Todas as transações são verificáveis na blockchain Solana.',
    'fees.nonCustodial': 'Non-Custodial',
    'fees.nonCustodialDesc': 'Você mantém controle total dos seus fundos durante todo o processo.',
    
    // FAQ
    'faq.title': 'Perguntas Frequentes',
    'faq.subtitle': 'Tire suas dúvidas sobre o SOL Reclaim.',
    'faq.q1': 'O que é rent na Solana?',
    'faq.a1': 'Rent é uma taxa obrigatória que a Solana cobra para manter contas ativas na blockchain. Quando você cria uma conta de token SPL ou recebe um NFT, uma pequena quantidade de SOL (geralmente ~0.002 SOL) é reservada como rent. Essa quantia fica "presa" até que você feche a conta.',
    'faq.q2': 'Quais tipos de contas posso fechar?',
    'faq.a2': 'Você pode fechar: 1) Contas de tokens SPL vazias (tokens que você já transferiu), 2) NFTs que você não quer mais (serão queimados), 3) Contas vazias sem nenhum propósito. Não fechamos contas que ainda possuem saldo ou que são necessárias para o funcionamento da sua wallet.',
    'faq.q3': 'É seguro usar esta ferramenta?',
    'faq.a3': 'Sim! Nunca solicitamos suas chaves privadas. Toda a operação é feita através de transações que você assina com sua própria wallet. Você tem controle total e pode revisar cada transação antes de aprovar. Somos 100% non-custodial.',
    'faq.q4': 'Quanto custa usar o serviço?',
    'faq.a4': 'Cobramos 5% sobre o total de SOL recuperado. Por exemplo, se você recuperar 0.1 SOL, a taxa será de 0.005 SOL. Essa taxa cobre os custos de desenvolvimento e manutenção da plataforma.',
    'faq.q5': 'Posso reverter o fechamento de uma conta?',
    'faq.a5': 'Não. O fechamento de contas é uma operação irreversível na blockchain Solana. Por isso, mostramos um aviso claro antes de você confirmar a transação. Tenha certeza de que deseja fechar as contas selecionadas.',
    'faq.q6': 'Por que alguns NFTs aparecem como "queimáveis"?',
    'faq.a6': 'NFTs aparecem como queimáveis quando identificamos que são de coleções spam, airdrops indesejados, ou quando você explicitamente os selecionou para queimar. Ao queimar um NFT, você recupera o rent associado a ele.',
    'faq.q7': 'Quanto tempo leva o processo?',
    'faq.a7': 'O escaneamento leva alguns segundos. A transação de fechamento depende do número de contas selecionadas e do congestionamento da rede Solana, mas geralmente é processada em menos de 1 minuto.',
    'faq.q8': 'Quais wallets são suportadas?',
    'faq.a8': 'Suportamos as principais wallets Solana: Phantom, Solflare e Backpack. Outras wallets compatíveis com o padrão Solana Wallet Adapter também podem funcionar.',
    
    // Footer
    'footer.tagline': 'Recupere seu SOL',
    'footer.rights': 'Todos os direitos reservados',
    'footer.builtOn': 'Construído na rede',
    
    // General
    'general.loading': 'Carregando...',
    
    // Stats
    'stats.solRecovered': 'SOL Recuperado',
    'stats.accountsClosed': 'Contas Fechadas',
    
    // VIP Banner
    'vipBanner.badge': 'Recompensas de Fidelidade',
    'vipBanner.title': 'Usuários recorrentes pagam',
    'vipBanner.titleHighlight': 'Taxas Menores',
    'vipBanner.subtitle': 'Quanto mais você usa nossa plataforma, menos você paga. Sistema de progressão automático baseado no seu nível e SOL total recuperado.',
    'vipBanner.level': 'Nível',
    'vipBanner.feesFrom': 'Taxas a partir de',
    'vipBanner.feesDesc': 'Membros Diamante pagam até 40% menos em taxas',
    'vipBanner.automatic': 'Upgrade Automático',
    'vipBanner.automaticDesc': 'Suba de nível usando a plataforma e ganhe mais XP',
    'vipBanner.exclusive': 'Benefícios Exclusivos',
    'vipBanner.exclusiveDesc': 'Suporte prioritário, badges exclusivos e sorteios especiais',
    'vipBanner.cta': 'Comece a recuperar SOL agora e',
    'vipBanner.ctaHighlight': 'veja suas taxas caírem automaticamente!',
    
    // VIP Benefits
    'vip.benefit.basicAccess': 'Acesso básico',
    'vip.benefit.standardAchievements': 'Conquistas padrão',
    'vip.benefit.reducedFee45': 'Taxa reduzida 4.5%',
    'vip.benefit.exclusiveBadge': 'Badge exclusivo',
    'vip.benefit.prioritySupport': 'Suporte prioritário',
    'vip.benefit.reducedFee40': 'Taxa reduzida 4%',
    'vip.benefit.xp10': 'XP +10%',
    'vip.benefit.earlyAccess': 'Acesso antecipado',
    'vip.benefit.reducedFee35': 'Taxa reduzida 3.5%',
    'vip.benefit.xp20': 'XP +20%',
    'vip.benefit.exclusiveNft': 'NFT exclusivo',
    'vip.benefit.minFee30': 'Taxa mínima 3%',
    'vip.benefit.xp30': 'XP +30%',
    'vip.benefit.vipAccess': 'Acesso VIP',
    'vip.benefit.specialRaffles': 'Sorteios especiais',
    
    // VIP Progress
    'vipProgress.title': 'Progresso VIP',
    'vipProgress.connectToSee': 'Conecte a wallet para ver seu progresso VIP',
    'vipProgress.maxTier': 'Nível máximo alcançado!',
    'vipProgress.levels': 'níveis',
    'vipProgress.toGo': 'restantes',
    'vipProgress.levelsToGo': 'níveis restantes',
    'vipProgress.progress': 'Progresso',
    'vipProgress.unlockNext': 'Alcance o próximo nível para desbloquear',
    'vipProgress.lowerFees': 'menos taxas',
  },
  
  es: {
    // Navigation
    'nav.howItWorks': 'Cómo Funciona',
    'nav.fees': 'Tarifas',
    'nav.faq': 'FAQ',
    'nav.profile': 'Perfil',
    'nav.scanner': 'Escáner',
    'nav.navigation': 'Navegación',
    'wallet.connected': 'Conectado',
    
    // Wallet
    'wallet.connect': 'Conectar Wallet',
    'wallet.disconnect': 'Desconectar',
    
    // Hero
    'hero.badge': 'Recupera SOL oculto',
    'hero.title': 'Recupera SOL atrapado en',
    'hero.titleHighlight': 'Cuentas Vacías',
    'hero.subtitle': '¿Tienes cuentas de token vacías y NFTs quemados? Recupera el rent pagado en SOL con solo un clic.',
    'hero.cta': 'Comenzar Ahora',
    'hero.stats.recovered': 'SOL Recuperados',
    'hero.stats.users': 'Usuarios Activos',
    'hero.stats.accounts': 'Cuentas Cerradas',
    'hero.benefit.noFees': 'Sin Tarifas Ocultas',
    'hero.benefit.fast': 'Ultra Rápido',
    'hero.benefit.secure': '100% Seguro',
    'hero.ranking': 'Ver Ranking',
    
    // Scanner
    'scanner.chooseChain': 'Elige Blockchain',
    'scanner.selectNetwork': 'Selecciona la red para recuperar tus fondos',
    'scanner.connectWallet': 'Conecta tu Wallet',
    'scanner.connectDesc': 'Conecta tu wallet Solana para escanear tus cuentas y recuperar SOL atrapado en rent.',
    'scanner.orTest': 'O prueba el sistema',
    'scanner.simulate': 'Simular Escaneo',
    'scanner.simulating': 'Simulando...',
    'scanner.scanning': 'Escaneando Blockchain',
    'scanner.searchingAccounts': 'Buscando cuentas de token y NFTs en Solana...',
    'scanner.simulationMode': 'Modo Simulación - Datos ficticios para demostración',
    'scanner.availableToRecover': 'disponible para recuperar',
    'scanner.accountsFound': 'Cuentas encontradas',
    'scanner.platformFee': 'Tarifa de plataforma',
    'scanner.feeCharged': 'Tarifa cobrada',
    'scanner.vipDiscount': 'Descuento VIP',
    'scanner.saving': 'Ahorrando',
    'scanner.youReceive': 'Recibes',
    'scanner.recover': 'Recuperar',
    'scanner.processing': 'Procesando...',
    'scanner.confirmTx': 'Al hacer clic, confirmarás la transacción en tu wallet',
    'scanner.viewDetails': 'Ver detalles de',
    'scanner.accounts': 'cuentas',
    'scanner.deselectAll': 'Deseleccionar Todo',
    'scanner.selectAll': 'Seleccionar Todo',
    'scanner.rescan': 'Re-escanear',
    'scanner.allClean': '¡Todo Limpio!',
    'scanner.solRecovered': '¡SOL Recuperado!',
    'scanner.noAccountsFound': 'No encontramos cuentas vacías o NFTs quemables en tu wallet.',
    'scanner.successMessage': '¡Todas las cuentas fueron cerradas con éxito y el SOL fue enviado a tu wallet!',
    'scanner.viewOnExplorer': 'Ver en Solana Explorer',
    'scanner.scanAgain': 'Escanear de Nuevo',
    
    // Profile
    'profile.title': 'Tu Perfil',
    'profile.subtitle': 'Logros, estadísticas y ranking',
    'profile.stats': 'Estadísticas',
    'profile.achievements': 'Logros',
    'profile.leaderboard': 'Ranking',
    'profile.vip': 'VIP',
    'profile.streak': 'Racha',
    
    // Mi Progreso (Sidebar)
    'progress.level': 'Nivel',
    'progress.stats': 'Estadísticas',
    'progress.transactions': 'Transacciones',
    'progress.achievements': 'Logros',
    'progress.leaderboard': 'Ranking',
    
    // VIP
    'vip.yourLevel': 'Tu nivel VIP',
    'vip.fee': 'tarifa',
    'vip.next': 'Siguiente',
    'vip.allLevels': 'Todos los niveles VIP',
    'vip.current': 'Actual',
    
    // Leaderboard
    'leaderboard.title': 'Top Recuperadores',
    'leaderboard.you': 'Tú',
    'leaderboard.level': 'Nvl',
    
    // Referral
    'referral.title': 'Invita Amigos',
    'referral.subtitle': 'Comparte tu código y gana recompensas',
    'referral.yourCode': 'Tu código de referencia',
    'referral.copied': '¡Copiado!',
    'referral.copy': 'Copiar',
    'referral.invited': 'Amigos invitados',
    'referral.applyCode': 'Aplicar código de referencia',
    'referral.apply': 'Aplicar',
    'referral.placeholder': 'Ingresa el código',
    
    // Streak
    'streak.title': 'Racha Diaria',
    'streak.currentStreak': 'Racha actual',
    'streak.days': 'días',
    'streak.bonus': 'Bonus de racha',
    'streak.keepStreak': '¡Usa la plataforma diariamente para mantener tu racha!',
    
    // How It Works
    'how.title': 'Cómo Funciona',
    'how.subtitle': 'Recupera tu SOL en 4 simples pasos',
    'how.step1.title': 'Conecta tu Wallet',
    'how.step1.desc': 'Conecta tu wallet Solana (Phantom, Solflare, Backpack) de forma segura',
    'how.step2.title': 'Escanea tus Cuentas',
    'how.step2.desc': 'Nuestro escáner identifica automáticamente cuentas vacías, NFTs quemables y rent recuperable',
    'how.step3.title': 'Selecciona y Quema',
    'how.step3.desc': 'Elige las cuentas que deseas cerrar. Tienes control total sobre lo que se procesará',
    'how.step4.title': 'Recupera tu SOL',
    'how.step4.desc': 'El SOL de rent es recuperado y enviado a tu wallet, menos la tarifa de la plataforma',
    
    // Fees
    'fees.title': 'Tarifas Transparentes',
    'fees.subtitle': 'Solo cobramos una pequeña tarifa sobre el SOL recuperado. Sin costos ocultos.',
    'fees.platformFee': 'Tarifa de Plataforma',
    'fees.perSolRecovered': 'por cada SOL recuperado',
    'fees.recovered': 'Recuperado',
    'fees.fee': 'Tarifa',
    'fees.secure': '100% Seguro',
    'fees.secureDesc': 'Nunca solicitamos claves privadas. Todo es firmado por tu wallet.',
    'fees.transparent': 'Transparente',
    'fees.transparentDesc': 'Todas las transacciones son verificables en la blockchain Solana.',
    'fees.nonCustodial': 'Non-Custodial',
    'fees.nonCustodialDesc': 'Mantienes control total de tus fondos durante todo el proceso.',
    
    // FAQ
    'faq.title': 'Preguntas Frecuentes',
    'faq.subtitle': 'Resuelve tus dudas sobre SOL Reclaim.',
    'faq.q1': '¿Qué es el rent en Solana?',
    'faq.a1': 'Rent es una tarifa obligatoria que Solana cobra para mantener cuentas activas en la blockchain. Cuando creas una cuenta de token SPL o recibes un NFT, una pequeña cantidad de SOL (usualmente ~0.002 SOL) se reserva como rent. Esta cantidad queda "atrapada" hasta que cierres la cuenta.',
    'faq.q2': '¿Qué tipos de cuentas puedo cerrar?',
    'faq.a2': 'Puedes cerrar: 1) Cuentas de tokens SPL vacías (tokens que ya transferiste), 2) NFTs que ya no quieres (serán quemados), 3) Cuentas vacías sin propósito. No cerramos cuentas que aún tienen saldo o que son necesarias para el funcionamiento de tu wallet.',
    'faq.q3': '¿Es seguro usar esta herramienta?',
    'faq.a3': '¡Sí! Nunca solicitamos tus claves privadas. Toda la operación se realiza a través de transacciones que firmas con tu propia wallet. Tienes control total y puedes revisar cada transacción antes de aprobar. Somos 100% non-custodial.',
    'faq.q4': '¿Cuánto cuesta usar el servicio?',
    'faq.a4': 'Cobramos 5% sobre el total de SOL recuperado. Por ejemplo, si recuperas 0.1 SOL, la tarifa será de 0.005 SOL. Esta tarifa cubre los costos de desarrollo y mantenimiento de la plataforma.',
    'faq.q5': '¿Puedo revertir el cierre de una cuenta?',
    'faq.a5': 'No. El cierre de cuentas es una operación irreversible en la blockchain Solana. Por eso mostramos un aviso claro antes de que confirmes la transacción. Asegúrate de que deseas cerrar las cuentas seleccionadas.',
    'faq.q6': '¿Por qué algunos NFTs aparecen como "quemables"?',
    'faq.a6': 'Los NFTs aparecen como quemables cuando identificamos que son de colecciones spam, airdrops no deseados, o cuando los has seleccionado explícitamente para quemar. Al quemar un NFT, recuperas el rent asociado a él.',
    'faq.q7': '¿Cuánto tiempo toma el proceso?',
    'faq.a7': 'El escaneo toma unos segundos. La transacción de cierre depende del número de cuentas seleccionadas y la congestión de la red Solana, pero usualmente se procesa en menos de 1 minuto.',
    'faq.q8': '¿Qué wallets son compatibles?',
    'faq.a8': 'Soportamos las principales wallets Solana: Phantom, Solflare y Backpack. Otras wallets compatibles con el estándar Solana Wallet Adapter también pueden funcionar.',
    
    // Footer
    'footer.tagline': 'Recupera tu SOL',
    'footer.rights': 'Todos los derechos reservados',
    'footer.builtOn': 'Construido en',
    
    // General
    'general.loading': 'Cargando...',
    
    // Stats
    'stats.solRecovered': 'SOL Recuperado',
    'stats.accountsClosed': 'Cuentas Cerradas',
    
    // VIP Banner
    'vipBanner.badge': 'Recompensas de Fidelidad',
    'vipBanner.title': 'Usuarios recurrentes pagan',
    'vipBanner.titleHighlight': 'Tarifas Menores',
    'vipBanner.subtitle': 'Cuanto más uses nuestra plataforma, menos pagas. Sistema de progresión automático basado en tu nivel y SOL total recuperado.',
    'vipBanner.level': 'Nivel',
    'vipBanner.feesFrom': 'Tarifas desde',
    'vipBanner.feesDesc': 'Miembros Diamante pagan hasta 40% menos en tarifas',
    'vipBanner.automatic': 'Ascenso Automático',
    'vipBanner.automaticDesc': 'Sube de nivel usando la plataforma y gana más XP',
    'vipBanner.exclusive': 'Beneficios Exclusivos',
    'vipBanner.exclusiveDesc': 'Soporte prioritario, badges exclusivos y sorteos especiales',
    'vipBanner.cta': 'Comienza a recuperar SOL ahora y',
    'vipBanner.ctaHighlight': '¡mira cómo bajan tus tarifas automáticamente!',
    
    // VIP Benefits
    'vip.benefit.basicAccess': 'Acceso básico',
    'vip.benefit.standardAchievements': 'Logros estándar',
    'vip.benefit.reducedFee45': 'Tarifa reducida 4.5%',
    'vip.benefit.exclusiveBadge': 'Badge exclusivo',
    'vip.benefit.prioritySupport': 'Soporte prioritario',
    'vip.benefit.reducedFee40': 'Tarifa reducida 4%',
    'vip.benefit.xp10': 'XP +10%',
    'vip.benefit.earlyAccess': 'Acceso anticipado',
    'vip.benefit.reducedFee35': 'Tarifa reducida 3.5%',
    'vip.benefit.xp20': 'XP +20%',
    'vip.benefit.exclusiveNft': 'NFT exclusivo',
    'vip.benefit.minFee30': 'Tarifa mínima 3%',
    'vip.benefit.xp30': 'XP +30%',
    'vip.benefit.vipAccess': 'Acceso VIP',
    'vip.benefit.specialRaffles': 'Sorteos especiales',
    
    // VIP Progress
    'vipProgress.title': 'Progreso VIP',
    'vipProgress.connectToSee': 'Conecta wallet para ver tu progreso VIP',
    'vipProgress.maxTier': '¡Nivel máximo alcanzado!',
    'vipProgress.levels': 'niveles',
    'vipProgress.toGo': 'restantes',
    'vipProgress.levelsToGo': 'niveles restantes',
    'vipProgress.progress': 'Progreso',
    'vipProgress.unlockNext': 'Alcanza el siguiente nivel para desbloquear',
    'vipProgress.lowerFees': 'menos tarifas',
  },
  
  fr: {
    // Navigation
    'nav.howItWorks': 'Comment ça marche',
    'nav.fees': 'Frais',
    'nav.faq': 'FAQ',
    'nav.profile': 'Profil',
    'nav.scanner': 'Scanner',
    'nav.navigation': 'Navigation',
    'wallet.connected': 'Connecté',
    
    // Wallet
    'wallet.connect': 'Connecter Wallet',
    'wallet.disconnect': 'Déconnecter',
    
    // Hero
    'hero.badge': 'Récupérer SOL caché',
    'hero.title': 'Récupérez SOL bloqué dans',
    'hero.titleHighlight': 'Comptes Vides',
    'hero.subtitle': 'Vous avez des comptes de jetons vides et des NFT brûlés? Récupérez le loyer payé en SOL en un seul clic.',
    'hero.cta': 'Commencer',
    'hero.stats.recovered': 'SOL Récupérés',
    'hero.stats.users': 'Utilisateurs Actifs',
    'hero.stats.accounts': 'Comptes Fermés',
    'hero.benefit.noFees': 'Sans Frais Cachés',
    'hero.benefit.fast': 'Ultra Rapide',
    'hero.benefit.secure': '100% Sécurisé',
    'hero.ranking': 'Voir Classement',
    
    // Scanner
    'scanner.chooseChain': 'Choisir Blockchain',
    'scanner.selectNetwork': 'Sélectionnez le réseau pour récupérer vos fonds',
    'scanner.connectWallet': 'Connectez votre Wallet',
    'scanner.connectDesc': 'Connectez votre wallet Solana pour scanner vos comptes et récupérer le SOL bloqué en loyer.',
    'scanner.orTest': 'Ou testez le système',
    'scanner.simulate': 'Simuler le Scan',
    'scanner.simulating': 'Simulation...',
    'scanner.scanning': 'Scan de la Blockchain',
    'scanner.searchingAccounts': 'Recherche de comptes de jetons et NFTs sur Solana...',
    'scanner.simulationMode': 'Mode Simulation - Données fictives pour démonstration',
    'scanner.availableToRecover': 'disponible à récupérer',
    'scanner.accountsFound': 'Comptes trouvés',
    'scanner.platformFee': 'Frais de plateforme',
    'scanner.feeCharged': 'Frais facturés',
    'scanner.vipDiscount': 'Réduction VIP',
    'scanner.saving': 'Économie',
    'scanner.youReceive': 'Vous recevez',
    'scanner.recover': 'Récupérer',
    'scanner.processing': 'Traitement...',
    'scanner.confirmTx': 'En cliquant, vous confirmerez la transaction dans votre wallet',
    'scanner.viewDetails': 'Voir détails de',
    'scanner.accounts': 'comptes',
    'scanner.deselectAll': 'Tout Désélectionner',
    'scanner.selectAll': 'Tout Sélectionner',
    'scanner.rescan': 'Re-scanner',
    'scanner.allClean': 'Tout est Propre!',
    'scanner.solRecovered': 'SOL Récupéré!',
    'scanner.noAccountsFound': "Nous n'avons trouvé aucun compte vide ou NFT brûlable dans votre wallet.",
    'scanner.successMessage': 'Tous les comptes ont été fermés avec succès et le SOL a été envoyé à votre wallet!',
    'scanner.viewOnExplorer': 'Voir sur Solana Explorer',
    'scanner.scanAgain': 'Scanner à Nouveau',
    
    // Profile
    'profile.title': 'Votre Profil',
    'profile.subtitle': 'Succès, statistiques et classement',
    'profile.stats': 'Statistiques',
    'profile.achievements': 'Succès',
    'profile.leaderboard': 'Classement',
    'profile.vip': 'VIP',
    'profile.streak': 'Série',
    
    // Ma Progression (Sidebar)
    'progress.level': 'Niveau',
    'progress.stats': 'Statistiques',
    'progress.transactions': 'Transactions',
    'progress.achievements': 'Succès',
    'progress.leaderboard': 'Classement',
    
    // VIP
    'vip.yourLevel': 'Votre niveau VIP',
    'vip.fee': 'frais',
    'vip.next': 'Suivant',
    'vip.allLevels': 'Tous les niveaux VIP',
    'vip.current': 'Actuel',
    
    // Leaderboard
    'leaderboard.title': 'Top Récupérateurs',
    'leaderboard.you': 'Vous',
    'leaderboard.level': 'Niv',
    
    // Referral
    'referral.title': 'Parrainez des Amis',
    'referral.subtitle': 'Partagez votre code et gagnez des récompenses',
    'referral.yourCode': 'Votre code de parrainage',
    'referral.copied': 'Copié!',
    'referral.copy': 'Copier',
    'referral.invited': 'Amis invités',
    'referral.applyCode': 'Appliquer code de parrainage',
    'referral.apply': 'Appliquer',
    'referral.placeholder': 'Entrez le code',
    
    // Streak
    'streak.title': 'Série Quotidienne',
    'streak.currentStreak': 'Série actuelle',
    'streak.days': 'jours',
    'streak.bonus': 'Bonus de série',
    'streak.keepStreak': 'Utilisez la plateforme quotidiennement pour maintenir votre série!',
    
    // How It Works
    'how.title': 'Comment ça Marche',
    'how.subtitle': 'Récupérez votre SOL en 4 étapes simples',
    'how.step1.title': 'Connectez votre Wallet',
    'how.step1.desc': 'Connectez votre wallet Solana (Phantom, Solflare, Backpack) en toute sécurité',
    'how.step2.title': 'Scannez vos Comptes',
    'how.step2.desc': 'Notre scanner identifie automatiquement les comptes vides, NFTs brûlables et loyer récupérable',
    'how.step3.title': 'Sélectionnez et Brûlez',
    'how.step3.desc': 'Choisissez les comptes à fermer. Vous avez un contrôle total sur ce qui sera traité',
    'how.step4.title': 'Récupérez votre SOL',
    'how.step4.desc': 'Le SOL de loyer est récupéré et envoyé à votre wallet, moins les frais de plateforme',
    
    // Fees
    'fees.title': 'Frais Transparents',
    'fees.subtitle': 'Nous ne facturons qu\'une petite commission sur le SOL récupéré. Pas de frais cachés.',
    'fees.platformFee': 'Frais de Plateforme',
    'fees.perSolRecovered': 'par SOL récupéré',
    'fees.recovered': 'Récupéré',
    'fees.fee': 'Frais',
    'fees.secure': '100% Sécurisé',
    'fees.secureDesc': 'Nous ne demandons jamais de clés privées. Tout est signé par votre wallet.',
    'fees.transparent': 'Transparent',
    'fees.transparentDesc': 'Toutes les transactions sont vérifiables sur la blockchain Solana.',
    'fees.nonCustodial': 'Non-Custodial',
    'fees.nonCustodialDesc': 'Vous gardez le contrôle total de vos fonds pendant tout le processus.',
    
    // FAQ
    'faq.title': 'Questions Fréquentes',
    'faq.subtitle': 'Répondez à vos questions sur SOL Reclaim.',
    'faq.q1': "Qu'est-ce que le loyer sur Solana?",
    'faq.a1': "Le loyer est une commission obligatoire que Solana facture pour maintenir les comptes actifs sur la blockchain. Lorsque vous créez un compte de jeton SPL ou recevez un NFT, une petite quantité de SOL (généralement ~0.002 SOL) est réservée comme loyer. Ce montant reste \"bloqué\" jusqu'à ce que vous fermiez le compte.",
    'faq.q2': 'Quels types de comptes puis-je fermer?',
    'faq.a2': "Vous pouvez fermer: 1) Comptes de jetons SPL vides (jetons que vous avez déjà transférés), 2) NFTs que vous ne voulez plus (seront brûlés), 3) Comptes vides sans but. Nous ne fermons pas les comptes qui ont encore un solde ou qui sont nécessaires au fonctionnement de votre wallet.",
    'faq.q3': 'Est-ce sûr à utiliser?',
    'faq.a3': "Oui! Nous ne demandons jamais vos clés privées. Toute l'opération se fait via des transactions que vous signez avec votre propre wallet. Vous avez un contrôle total et pouvez examiner chaque transaction avant d'approuver. Nous sommes 100% non-custodial.",
    'faq.q4': 'Combien coûte le service?',
    'faq.a4': "Nous facturons 5% sur le total de SOL récupéré. Par exemple, si vous récupérez 0.1 SOL, les frais seront de 0.005 SOL. Ces frais couvrent les coûts de développement et de maintenance de la plateforme.",
    'faq.q5': "Puis-je annuler la fermeture d'un compte?",
    'faq.a5': "Non. La fermeture de comptes est une opération irréversible sur la blockchain Solana. C'est pourquoi nous affichons un avertissement clair avant que vous confirmiez la transaction. Assurez-vous de vouloir fermer les comptes sélectionnés.",
    'faq.q6': 'Pourquoi certains NFTs apparaissent comme "brûlables"?',
    'faq.a6': "Les NFTs apparaissent comme brûlables lorsque nous identifions qu'ils proviennent de collections spam, d'airdrops indésirables, ou lorsque vous les avez explicitement sélectionnés pour les brûler. En brûlant un NFT, vous récupérez le loyer associé.",
    'faq.q7': 'Combien de temps prend le processus?',
    'faq.a7': 'Le scan prend quelques secondes. La transaction de fermeture dépend du nombre de comptes sélectionnés et de la congestion du réseau Solana, mais est généralement traitée en moins de 1 minute.',
    'faq.q8': 'Quels wallets sont supportés?',
    'faq.a8': 'Nous supportons les principaux wallets Solana: Phantom, Solflare et Backpack. D\'autres wallets compatibles avec le standard Solana Wallet Adapter peuvent également fonctionner.',
    
    // Footer
    'footer.tagline': 'Récupérez votre SOL',
    'footer.rights': 'Tous droits réservés',
    'footer.builtOn': 'Construit sur',
    
    // General
    'general.loading': 'Chargement...',
    
    // Stats
    'stats.solRecovered': 'SOL Récupéré',
    'stats.accountsClosed': 'Comptes Fermés',
    
    // VIP Banner
    'vipBanner.badge': 'Récompenses Fidélité',
    'vipBanner.title': 'Les utilisateurs réguliers paient',
    'vipBanner.titleHighlight': 'Moins de Frais',
    'vipBanner.subtitle': 'Plus vous utilisez notre plateforme, moins vous payez. Système de progression automatique basé sur votre niveau et SOL total récupéré.',
    'vipBanner.level': 'Niveau',
    'vipBanner.feesFrom': 'Frais à partir de',
    'vipBanner.feesDesc': 'Les membres Diamant paient jusqu\'à 40% de frais en moins',
    'vipBanner.automatic': 'Montée Automatique',
    'vipBanner.automaticDesc': 'Montez de niveau en utilisant la plateforme et gagnez plus de XP',
    'vipBanner.exclusive': 'Avantages Exclusifs',
    'vipBanner.exclusiveDesc': 'Support prioritaire, badges exclusifs et tirages spéciaux',
    'vipBanner.cta': 'Commencez à récupérer du SOL maintenant et',
    'vipBanner.ctaHighlight': 'regardez vos frais baisser automatiquement!',
    
    // VIP Benefits
    'vip.benefit.basicAccess': 'Accès de base',
    'vip.benefit.standardAchievements': 'Succès standard',
    'vip.benefit.reducedFee45': 'Frais réduits 4.5%',
    'vip.benefit.exclusiveBadge': 'Badge exclusif',
    'vip.benefit.prioritySupport': 'Support prioritaire',
    'vip.benefit.reducedFee40': 'Frais réduits 4%',
    'vip.benefit.xp10': 'XP +10%',
    'vip.benefit.earlyAccess': 'Accès anticipé',
    'vip.benefit.reducedFee35': 'Frais réduits 3.5%',
    'vip.benefit.xp20': 'XP +20%',
    'vip.benefit.exclusiveNft': 'NFT exclusif',
    'vip.benefit.minFee30': 'Frais minimum 3%',
    'vip.benefit.xp30': 'XP +30%',
    'vip.benefit.vipAccess': 'Accès VIP',
    'vip.benefit.specialRaffles': 'Tirages spéciaux',
    
    // VIP Progress
    'vipProgress.title': 'Progression VIP',
    'vipProgress.connectToSee': 'Connectez wallet pour voir votre progression VIP',
    'vipProgress.maxTier': 'Niveau maximum atteint!',
    'vipProgress.levels': 'niveaux',
    'vipProgress.toGo': 'restants',
    'vipProgress.levelsToGo': 'niveaux restants',
    'vipProgress.progress': 'Progression',
    'vipProgress.unlockNext': 'Atteignez le niveau suivant pour débloquer',
    'vipProgress.lowerFees': 'de frais en moins',
  },
  
  de: {
    // Navigation
    'nav.howItWorks': 'Wie es funktioniert',
    'nav.fees': 'Gebühren',
    'nav.faq': 'FAQ',
    'nav.profile': 'Profil',
    'nav.scanner': 'Scanner',
    'nav.navigation': 'Navigation',
    'wallet.connected': 'Verbunden',
    
    // Wallet
    'wallet.connect': 'Wallet verbinden',
    'wallet.disconnect': 'Trennen',
    
    // Hero
    'hero.badge': 'Verstecktes SOL wiederherstellen',
    'hero.title': 'SOL wiederherstellen, das in',
    'hero.titleHighlight': 'leeren Konten',
    'hero.subtitle': 'Haben Sie leere Token-Konten und verbrannte NFTs? Stellen Sie die in SOL gezahlte Miete mit nur einem Klick wieder her.',
    'hero.cta': 'Jetzt starten',
    'hero.stats.recovered': 'SOL Wiederhergestellt',
    'hero.stats.users': 'Aktive Benutzer',
    'hero.stats.accounts': 'Geschlossene Konten',
    'hero.benefit.noFees': 'Keine versteckten Gebühren',
    'hero.benefit.fast': 'Ultra Schnell',
    'hero.benefit.secure': '100% Sicher',
    'hero.ranking': 'Rangliste anzeigen',
    
    // Scanner
    'scanner.chooseChain': 'Blockchain wählen',
    'scanner.selectNetwork': 'Wählen Sie das Netzwerk, um Ihre Mittel wiederherzustellen',
    'scanner.connectWallet': 'Wallet verbinden',
    'scanner.connectDesc': 'Verbinden Sie Ihre Solana-Wallet, um Ihre Konten zu scannen und in Miete blockiertes SOL wiederherzustellen.',
    'scanner.orTest': 'Oder testen Sie das System',
    'scanner.simulate': 'Scan simulieren',
    'scanner.simulating': 'Simuliere...',
    'scanner.scanning': 'Blockchain scannen',
    'scanner.searchingAccounts': 'Suche nach Token-Konten und NFTs auf Solana...',
    'scanner.simulationMode': 'Simulationsmodus - Fiktive Daten zur Demonstration',
    'scanner.availableToRecover': 'verfügbar zur Wiederherstellung',
    'scanner.accountsFound': 'Konten gefunden',
    'scanner.platformFee': 'Plattformgebühr',
    'scanner.feeCharged': 'Erhobene Gebühr',
    'scanner.vipDiscount': 'VIP-Rabatt',
    'scanner.saving': 'Ersparnis',
    'scanner.youReceive': 'Sie erhalten',
    'scanner.recover': 'Wiederherstellen',
    'scanner.processing': 'Verarbeite...',
    'scanner.confirmTx': 'Durch Klicken bestätigen Sie die Transaktion in Ihrer Wallet',
    'scanner.viewDetails': 'Details anzeigen von',
    'scanner.accounts': 'Konten',
    'scanner.deselectAll': 'Alle abwählen',
    'scanner.selectAll': 'Alle auswählen',
    'scanner.rescan': 'Erneut scannen',
    'scanner.allClean': 'Alles sauber!',
    'scanner.solRecovered': 'SOL Wiederhergestellt!',
    'scanner.noAccountsFound': 'Wir haben keine leeren Konten oder brennbare NFTs in Ihrer Wallet gefunden.',
    'scanner.successMessage': 'Alle Konten wurden erfolgreich geschlossen und SOL wurde an Ihre Wallet gesendet!',
    'scanner.viewOnExplorer': 'Auf Solana Explorer anzeigen',
    'scanner.scanAgain': 'Erneut scannen',
    
    // Profile
    'profile.title': 'Ihr Profil',
    'profile.subtitle': 'Erfolge, Statistiken und Rangliste',
    'profile.stats': 'Statistiken',
    'profile.achievements': 'Erfolge',
    'profile.leaderboard': 'Rangliste',
    'profile.vip': 'VIP',
    'profile.streak': 'Serie',
    
    // Mein Fortschritt (Sidebar)
    'progress.level': 'Stufe',
    'progress.stats': 'Statistiken',
    'progress.transactions': 'Transaktionen',
    'progress.achievements': 'Erfolge',
    'progress.leaderboard': 'Rangliste',
    
    // VIP
    'vip.yourLevel': 'Ihr VIP-Level',
    'vip.fee': 'Gebühr',
    'vip.next': 'Nächste',
    'vip.allLevels': 'Alle VIP-Level',
    'vip.current': 'Aktuell',
    
    // Leaderboard
    'leaderboard.title': 'Top Wiederhersteller',
    'leaderboard.you': 'Sie',
    'leaderboard.level': 'Lvl',
    
    // Referral
    'referral.title': 'Freunde empfehlen',
    'referral.subtitle': 'Teilen Sie Ihren Code und verdienen Sie Belohnungen',
    'referral.yourCode': 'Ihr Empfehlungscode',
    'referral.copied': 'Kopiert!',
    'referral.copy': 'Kopieren',
    'referral.invited': 'Eingeladene Freunde',
    'referral.applyCode': 'Empfehlungscode anwenden',
    'referral.apply': 'Anwenden',
    'referral.placeholder': 'Code eingeben',
    
    // Streak
    'streak.title': 'Tägliche Serie',
    'streak.currentStreak': 'Aktuelle Serie',
    'streak.days': 'Tage',
    'streak.bonus': 'Serienbonus',
    'streak.keepStreak': 'Nutzen Sie die Plattform täglich, um Ihre Serie zu halten!',
    
    // How It Works
    'how.title': 'Wie es funktioniert',
    'how.subtitle': 'Stellen Sie Ihr SOL in 4 einfachen Schritten wieder her',
    'how.step1.title': 'Wallet verbinden',
    'how.step1.desc': 'Verbinden Sie Ihre Solana-Wallet (Phantom, Solflare, Backpack) sicher',
    'how.step2.title': 'Konten scannen',
    'how.step2.desc': 'Unser Scanner identifiziert automatisch leere Konten, brennbare NFTs und wiederherstellbare Miete',
    'how.step3.title': 'Auswählen & Brennen',
    'how.step3.desc': 'Wählen Sie die Konten, die Sie schließen möchten. Sie haben die volle Kontrolle über das, was verarbeitet wird',
    'how.step4.title': 'SOL wiederherstellen',
    'how.step4.desc': 'Das Miete-SOL wird wiederhergestellt und an Ihre Wallet gesendet, abzüglich der Plattformgebühr',
    
    // Fees
    'fees.title': 'Transparente Gebühren',
    'fees.subtitle': 'Wir berechnen nur eine kleine Gebühr auf wiederhergestelltes SOL. Keine versteckten Kosten.',
    'fees.platformFee': 'Plattformgebühr',
    'fees.perSolRecovered': 'pro wiederhergestelltem SOL',
    'fees.recovered': 'Wiederhergestellt',
    'fees.fee': 'Gebühr',
    'fees.secure': '100% Sicher',
    'fees.secureDesc': 'Wir fragen nie nach privaten Schlüsseln. Alles wird von Ihrer Wallet signiert.',
    'fees.transparent': 'Transparent',
    'fees.transparentDesc': 'Alle Transaktionen sind auf der Solana-Blockchain überprüfbar.',
    'fees.nonCustodial': 'Non-Custodial',
    'fees.nonCustodialDesc': 'Sie behalten die volle Kontrolle über Ihre Mittel während des gesamten Prozesses.',
    
    // FAQ
    'faq.title': 'Häufig gestellte Fragen',
    'faq.subtitle': 'Beantworten Sie Ihre Fragen zu SOL Reclaim.',
    'faq.q1': 'Was ist Miete auf Solana?',
    'faq.a1': 'Miete ist eine obligatorische Gebühr, die Solana erhebt, um Konten auf der Blockchain aktiv zu halten. Wenn Sie ein SPL-Token-Konto erstellen oder ein NFT erhalten, wird eine kleine Menge SOL (normalerweise ~0.002 SOL) als Miete reserviert. Dieser Betrag bleibt "blockiert", bis Sie das Konto schließen.',
    'faq.q2': 'Welche Arten von Konten kann ich schließen?',
    'faq.a2': 'Sie können schließen: 1) Leere SPL-Token-Konten (Token, die Sie bereits übertragen haben), 2) NFTs, die Sie nicht mehr möchten (werden verbrannt), 3) Leere Konten ohne Zweck. Wir schließen keine Konten, die noch ein Guthaben haben oder für die Funktion Ihrer Wallet notwendig sind.',
    'faq.q3': 'Ist es sicher zu benutzen?',
    'faq.a3': 'Ja! Wir fragen nie nach Ihren privaten Schlüsseln. Alle Operationen werden über Transaktionen durchgeführt, die Sie mit Ihrer eigenen Wallet signieren. Sie haben die volle Kontrolle und können jede Transaktion vor der Genehmigung überprüfen. Wir sind 100% non-custodial.',
    'faq.q4': 'Wie viel kostet der Service?',
    'faq.a4': 'Wir berechnen 5% auf das gesamte wiederhergestellte SOL. Wenn Sie beispielsweise 0.1 SOL wiederherstellen, beträgt die Gebühr 0.005 SOL. Diese Gebühr deckt die Entwicklungs- und Wartungskosten der Plattform.',
    'faq.q5': 'Kann ich das Schließen eines Kontos rückgängig machen?',
    'faq.a5': 'Nein. Das Schließen von Konten ist eine irreversible Operation auf der Solana-Blockchain. Deshalb zeigen wir eine klare Warnung, bevor Sie die Transaktion bestätigen. Stellen Sie sicher, dass Sie die ausgewählten Konten schließen möchten.',
    'faq.q6': 'Warum erscheinen einige NFTs als "brennbar"?',
    'faq.a6': 'NFTs erscheinen als brennbar, wenn wir identifizieren, dass sie aus Spam-Sammlungen, unerwünschten Airdrops stammen oder wenn Sie sie explizit zum Verbrennen ausgewählt haben. Wenn Sie ein NFT verbrennen, stellen Sie die damit verbundene Miete wieder her.',
    'faq.q7': 'Wie lange dauert der Prozess?',
    'faq.a7': 'Das Scannen dauert einige Sekunden. Die Schließungstransaktion hängt von der Anzahl der ausgewählten Konten und der Auslastung des Solana-Netzwerks ab, wird aber normalerweise in weniger als 1 Minute verarbeitet.',
    'faq.q8': 'Welche Wallets werden unterstützt?',
    'faq.a8': 'Wir unterstützen die wichtigsten Solana-Wallets: Phantom, Solflare und Backpack. Andere Wallets, die mit dem Solana Wallet Adapter-Standard kompatibel sind, können ebenfalls funktionieren.',
    
    // Footer
    'footer.tagline': 'Ihr SOL wiederherstellen',
    'footer.rights': 'Alle Rechte vorbehalten',
    'footer.builtOn': 'Gebaut auf',
    
    // General
    'general.loading': 'Laden...',
    
    // Stats
    'stats.solRecovered': 'SOL Wiederhergestellt',
    'stats.accountsClosed': 'Geschlossene Konten',
    
    // VIP Banner
    'vipBanner.badge': 'Treue-Belohnungen',
    'vipBanner.title': 'Wiederkehrende Nutzer zahlen',
    'vipBanner.titleHighlight': 'Niedrigere Gebühren',
    'vipBanner.subtitle': 'Je mehr Sie unsere Plattform nutzen, desto weniger zahlen Sie. Automatisches Progressionssystem basierend auf Ihrem Level und insgesamt wiederhergestelltem SOL.',
    'vipBanner.level': 'Level',
    'vipBanner.feesFrom': 'Gebühren ab',
    'vipBanner.feesDesc': 'Diamant-Mitglieder zahlen bis zu 40% weniger Gebühren',
    'vipBanner.automatic': 'Automatischer Aufstieg',
    'vipBanner.automaticDesc': 'Steigen Sie durch Nutzung der Plattform auf und verdienen Sie mehr XP',
    'vipBanner.exclusive': 'Exklusive Vorteile',
    'vipBanner.exclusiveDesc': 'Prioritärer Support, exklusive Badges und spezielle Verlosungen',
    'vipBanner.cta': 'Beginnen Sie jetzt mit der SOL-Wiederherstellung und',
    'vipBanner.ctaHighlight': 'sehen Sie, wie Ihre Gebühren automatisch sinken!',
    
    // VIP Benefits
    'vip.benefit.basicAccess': 'Basiszugang',
    'vip.benefit.standardAchievements': 'Standard-Erfolge',
    'vip.benefit.reducedFee45': 'Reduzierte Gebühr 4.5%',
    'vip.benefit.exclusiveBadge': 'Exklusives Badge',
    'vip.benefit.prioritySupport': 'Prioritärer Support',
    'vip.benefit.reducedFee40': 'Reduzierte Gebühr 4%',
    'vip.benefit.xp10': 'XP +10%',
    'vip.benefit.earlyAccess': 'Frühzeitiger Zugang',
    'vip.benefit.reducedFee35': 'Reduzierte Gebühr 3.5%',
    'vip.benefit.xp20': 'XP +20%',
    'vip.benefit.exclusiveNft': 'Exklusives NFT',
    'vip.benefit.minFee30': 'Mindestgebühr 3%',
    'vip.benefit.xp30': 'XP +30%',
    'vip.benefit.vipAccess': 'VIP-Zugang',
    'vip.benefit.specialRaffles': 'Spezielle Verlosungen',
    
    // VIP Progress
    'vipProgress.title': 'VIP-Fortschritt',
    'vipProgress.connectToSee': 'Wallet verbinden um VIP-Fortschritt zu sehen',
    'vipProgress.maxTier': 'Maximales Level erreicht!',
    'vipProgress.levels': 'Level',
    'vipProgress.toGo': 'übrig',
    'vipProgress.levelsToGo': 'Level übrig',
    'vipProgress.progress': 'Fortschritt',
    'vipProgress.unlockNext': 'Erreichen Sie das nächste Level für',
    'vipProgress.lowerFees': 'weniger Gebühren',
  },
  
  zh: {
    // Navigation
    'nav.howItWorks': '工作原理',
    'nav.fees': '费用',
    'nav.faq': '常见问题',
    'nav.profile': '个人资料',
    'nav.scanner': '扫描器',
    'nav.navigation': '导航',
    'wallet.connected': '已连接',
    
    // Wallet
    'wallet.connect': '连接钱包',
    'wallet.disconnect': '断开连接',
    
    // Hero
    'hero.badge': '恢复隐藏的SOL',
    'hero.title': '恢复卡在',
    'hero.titleHighlight': '空账户中的SOL',
    'hero.subtitle': '您有空的代币账户和已销毁的NFT吗？只需点击一下即可恢复以SOL支付的租金。',
    'hero.cta': '立即开始',
    'hero.stats.recovered': '已恢复SOL',
    'hero.stats.users': '活跃用户',
    'hero.stats.accounts': '已关闭账户',
    'hero.benefit.noFees': '无隐藏费用',
    'hero.benefit.fast': '超快速',
    'hero.benefit.secure': '100%安全',
    'hero.ranking': '查看排名',
    
    // Scanner
    'scanner.chooseChain': '选择区块链',
    'scanner.selectNetwork': '选择网络以恢复您的资金',
    'scanner.connectWallet': '连接您的钱包',
    'scanner.connectDesc': '连接您的Solana钱包以扫描您的账户并恢复被锁定在租金中的SOL。',
    'scanner.orTest': '或测试系统',
    'scanner.simulate': '模拟扫描',
    'scanner.simulating': '模拟中...',
    'scanner.scanning': '扫描区块链',
    'scanner.searchingAccounts': '在Solana上搜索代币账户和NFT...',
    'scanner.simulationMode': '模拟模式 - 用于演示的虚拟数据',
    'scanner.availableToRecover': '可恢复',
    'scanner.accountsFound': '找到的账户',
    'scanner.platformFee': '平台费用',
    'scanner.feeCharged': '收取的费用',
    'scanner.vipDiscount': 'VIP折扣',
    'scanner.saving': '节省',
    'scanner.youReceive': '您将收到',
    'scanner.recover': '恢复',
    'scanner.processing': '处理中...',
    'scanner.confirmTx': '点击后，您将在钱包中确认交易',
    'scanner.viewDetails': '查看详情',
    'scanner.accounts': '个账户',
    'scanner.deselectAll': '取消全选',
    'scanner.selectAll': '全选',
    'scanner.rescan': '重新扫描',
    'scanner.allClean': '全部清理完毕！',
    'scanner.solRecovered': 'SOL已恢复！',
    'scanner.noAccountsFound': '我们在您的钱包中没有找到任何空账户或可销毁的NFT。',
    'scanner.successMessage': '所有账户已成功关闭，SOL已发送到您的钱包！',
    'scanner.viewOnExplorer': '在Solana Explorer上查看',
    'scanner.scanAgain': '再次扫描',
    
    // Profile
    'profile.title': '您的个人资料',
    'profile.subtitle': '成就、统计和排名',
    'profile.stats': '统计',
    'profile.achievements': '成就',
    'profile.leaderboard': '排行榜',
    'profile.vip': 'VIP',
    'profile.streak': '连续',
    
    // 我的进度 (Sidebar)
    'progress.level': '等级',
    'progress.stats': '统计',
    'progress.transactions': '交易',
    'progress.achievements': '成就',
    'progress.leaderboard': '排行榜',
    
    // VIP
    'vip.yourLevel': '您的VIP等级',
    'vip.fee': '费率',
    'vip.next': '下一个',
    'vip.allLevels': '所有VIP等级',
    'vip.current': '当前',
    
    // Leaderboard
    'leaderboard.title': '顶级恢复者',
    'leaderboard.you': '您',
    'leaderboard.level': '等级',
    
    // Referral
    'referral.title': '推荐朋友',
    'referral.subtitle': '分享您的代码并赚取奖励',
    'referral.yourCode': '您的推荐代码',
    'referral.copied': '已复制！',
    'referral.copy': '复制',
    'referral.invited': '已邀请的朋友',
    'referral.applyCode': '应用推荐代码',
    'referral.apply': '应用',
    'referral.placeholder': '输入代码',
    
    // Streak
    'streak.title': '每日连续',
    'streak.currentStreak': '当前连续',
    'streak.days': '天',
    'streak.bonus': '连续奖励',
    'streak.keepStreak': '每天使用平台以保持您的连续！',
    
    // How It Works
    'how.title': '工作原理',
    'how.subtitle': '通过4个简单步骤恢复您的SOL',
    'how.step1.title': '连接钱包',
    'how.step1.desc': '安全连接您的Solana钱包（Phantom、Solflare、Backpack）',
    'how.step2.title': '扫描账户',
    'how.step2.desc': '我们的扫描器自动识别空账户、可销毁的NFT和可恢复的租金',
    'how.step3.title': '选择并销毁',
    'how.step3.desc': '选择您要关闭的账户。您可以完全控制将处理的内容',
    'how.step4.title': '恢复SOL',
    'how.step4.desc': '租金SOL被恢复并发送到您的钱包，扣除平台费用',
    
    // Fees
    'fees.title': '透明费用',
    'fees.subtitle': '我们只对恢复的SOL收取少量费用。没有隐藏成本。',
    'fees.platformFee': '平台费用',
    'fees.perSolRecovered': '每恢复SOL',
    'fees.recovered': '已恢复',
    'fees.fee': '费用',
    'fees.secure': '100%安全',
    'fees.secureDesc': '我们从不索要私钥。一切都由您的钱包签名。',
    'fees.transparent': '透明',
    'fees.transparentDesc': '所有交易都可以在Solana区块链上验证。',
    'fees.nonCustodial': '非托管',
    'fees.nonCustodialDesc': '您在整个过程中保持对资金的完全控制。',
    
    // FAQ
    'faq.title': '常见问题',
    'faq.subtitle': '解答您关于SOL Reclaim的问题。',
    'faq.q1': '什么是Solana上的租金？',
    'faq.a1': '租金是Solana收取的强制性费用，用于在区块链上保持账户活跃。当您创建SPL代币账户或收到NFT时，会保留少量SOL（通常约0.002 SOL）作为租金。这笔金额会保持"锁定"状态，直到您关闭账户。',
    'faq.q2': '我可以关闭哪些类型的账户？',
    'faq.a2': '您可以关闭：1）空的SPL代币账户（您已转移的代币），2）您不再想要的NFT（将被销毁），3）没有用途的空账户。我们不会关闭仍有余额或对您的钱包功能必需的账户。',
    'faq.q3': '使用安全吗？',
    'faq.a3': '是的！我们从不索要您的私钥。所有操作都通过您用自己的钱包签名的交易完成。您拥有完全控制权，可以在批准前审查每笔交易。我们是100%非托管的。',
    'faq.q4': '服务费用是多少？',
    'faq.a4': '我们收取恢复SOL总额的5%。例如，如果您恢复0.1 SOL，费用将为0.005 SOL。此费用涵盖平台的开发和维护成本。',
    'faq.q5': '我可以撤销关闭账户吗？',
    'faq.a5': '不可以。关闭账户是Solana区块链上的不可逆操作。这就是为什么我们在您确认交易之前显示明确警告。确保您想要关闭所选账户。',
    'faq.q6': '为什么有些NFT显示为"可销毁"？',
    'faq.a6': '当我们识别到NFT来自垃圾收藏、不需要的空投，或当您明确选择销毁它们时，NFT会显示为可销毁。当您销毁NFT时，您会恢复与其相关的租金。',
    'faq.q7': '过程需要多长时间？',
    'faq.a7': '扫描需要几秒钟。关闭交易取决于所选账户数量和Solana网络拥塞情况，但通常在不到1分钟内处理完成。',
    'faq.q8': '支持哪些钱包？',
    'faq.a8': '我们支持主要的Solana钱包：Phantom、Solflare和Backpack。其他与Solana Wallet Adapter标准兼容的钱包也可能有效。',
    
    // Footer
    'footer.tagline': '恢复您的SOL',
    'footer.rights': '版权所有',
    'footer.builtOn': '构建于',
    
    // General
    'general.loading': '加载中...',
    
    // Stats
    'stats.solRecovered': 'SOL已恢复',
    'stats.accountsClosed': '已关闭账户',
    
    // VIP Banner
    'vipBanner.badge': '忠诚奖励',
    'vipBanner.title': '老用户支付',
    'vipBanner.titleHighlight': '更低的费用',
    'vipBanner.subtitle': '您使用我们平台越多，支付越少。基于您的等级和总恢复SOL的自动进阶系统。',
    'vipBanner.level': '等级',
    'vipBanner.feesFrom': '费用低至',
    'vipBanner.feesDesc': '钻石会员支付的费用减少高达40%',
    'vipBanner.automatic': '自动升级',
    'vipBanner.automaticDesc': '通过使用平台升级并赚取更多XP',
    'vipBanner.exclusive': '专属福利',
    'vipBanner.exclusiveDesc': '优先支持、专属徽章和特别抽奖',
    'vipBanner.cta': '现在开始恢复SOL，',
    'vipBanner.ctaHighlight': '看着您的费用自动降低！',
    
    // VIP Benefits
    'vip.benefit.basicAccess': '基本访问',
    'vip.benefit.standardAchievements': '标准成就',
    'vip.benefit.reducedFee45': '4.5%优惠费率',
    'vip.benefit.exclusiveBadge': '专属徽章',
    'vip.benefit.prioritySupport': '优先支持',
    'vip.benefit.reducedFee40': '4%优惠费率',
    'vip.benefit.xp10': 'XP +10%',
    'vip.benefit.earlyAccess': '抢先体验',
    'vip.benefit.reducedFee35': '3.5%优惠费率',
    'vip.benefit.xp20': 'XP +20%',
    'vip.benefit.exclusiveNft': '专属NFT',
    'vip.benefit.minFee30': '3%最低费率',
    'vip.benefit.xp30': 'XP +30%',
    'vip.benefit.vipAccess': 'VIP访问',
    'vip.benefit.specialRaffles': '特别抽奖',
    
    // VIP Progress
    'vipProgress.title': 'VIP进度',
    'vipProgress.connectToSee': '连接钱包查看您的VIP进度',
    'vipProgress.maxTier': '已达到最高等级！',
    'vipProgress.levels': '等级',
    'vipProgress.toGo': '剩余',
    'vipProgress.levelsToGo': '等级剩余',
    'vipProgress.progress': '进度',
    'vipProgress.unlockNext': '达到下一等级解锁',
    'vipProgress.lowerFees': '更低费用',
  },
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language');
      return (saved as Language) || 'en';
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
