"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type Locale = "ru" | "en";

const localeKey = "chesscoach.locale";

const dictionaries = {
  en: {
    brandTagline: "Competitive chess training",
    lobby: "Lobby",
    leaderboard: "Leaderboard",
    rank: "Rank",
    pro: "Pro",
    signIn: "Sign in",
    signUp: "Sign up",
    logout: "Logout",
    guestProfile: "Guest profile",
    founderPro: "Founder Pro",
    play: "Play",
    friendRoom: "Friend Room",
    trainingBot: "Training Bot",
    sameDevice: "Same Device",
    newGame: "New Game",
    rematch: "Rematch",
    resign: "Resign",
    draw: "Draw",
    analyzeGame: "Game Review",
    gameReview: "Game Review",
    copyInvite: "Copy invite link",
    botThinking: "Bot is thinking...",
    white: "White",
    black: "Black",
    bullet: "Bullet",
    blitz: "Blitz",
    rapid: "Rapid",
    classical: "Classical",
    cityArenaRankings: "Arena Rankings",
    yourRank: "Your Rank",
    reviewedGames: "Reviewed Games",
    currentForm: "Current Form",
    startTraining: "Start Training",
    playGame: "Play a Game",
    chooseGame: "Choose your game",
    lobbySubtitle: "Choose a friend room, training bot, or same-device game.",
    lobbyKicker: "Clean games, clear clocks, useful reviews.",
    displayName: "Display name",
    city: "City",
    timeControl: "Time Control",
    botLevel: "Bot level",
    yourColor: "Your color",
    random: "Random",
    createFriendRoom: "Create Friend Room",
    playTrainingBot: "Play Training Bot",
    playSameDevice: "Play Same Device",
    joinRoom: "Join Room by Code",
    join: "Join",
    cityRank: "City Rank",
    rankSaved: "Rank saved",
    progressSaved: "Progress saved",
    thisDevice: "This device",
    yourMove: "Your move",
    opponentsMove: "Opponent's move",
    whiteToMove: "White to move",
    blackToMove: "Black to move",
    practiceGame: "Practice game",
    syncedGame: "Friend room",
    spectatorMode: "Spectating",
    waitingOpponent: "Waiting for opponent",
    movesEmpty: "Move list will appear after the first move.",
    scoreSheet: "Move list",
    matchPulse: "Match notes",
    captures: "Captures",
    checks: "Checks",
    phase: "Phase",
    opening: "Opening",
    middlegame: "Middle",
    endgame: "Endgame",
    landingTitle: "ChessCoach Arena",
    landingSubtitle: "Play clean chess games, review key mistakes, train against a bot, and climb a competitive leaderboard.",
    startGame: "Start Game",
    seeProDemo: "See Pro Demo",
    bestDemoPath: "Best demo path: play a short game, then open the Game Review.",
    authTitle: "Save your games, reviews, and rank.",
    authSubtitle: "Create an account for your profile, Pro demo status, and leaderboard progress.",
    playerAccount: "Player account",
    email: "Email",
    password: "Password",
    createDemoAccount: "Create account",
    signInAndSync: "Sign in",
    proTitle: "Pro turns review into a training routine.",
    proSubtitle: "Deeper game review, blunder drills, training cards, and a tasteful Founder badge. Demo only, no card required.",
    noRealPayment: "No real payment",
    upgradeToProDemo: "Activate Pro Demo",
    proActive: "Founder Pro active",
    noReviewFound: "No review found",
    emptyCoachRoom: "This review is empty.",
    startFromLobby: "Start from lobby",
    viewDemoReview: "View demo review",
    coachRoom: "Game Review",
    coachReview: "Coach review",
    coachVerdict: "Review verdict",
    moveArchive: "Move list",
    moveTimeline: "Move timeline",
    whatChanged: "What changed",
    materialSwing: "Material swing",
    phaseAdvice: "Phase advice",
    deeperReview: "Deeper review",
    positionDrill: "Training drill",
    keyMoment: "Key moment",
    biggestMistake: "Key moment",
    betterMove: "Better move",
    trainingDrill: "Training drill",
    personalizedTips: "Training notes",
    friendlyCoach: "Friendly Coach",
    strictCoach: "Strict Coach",
    interviewCoach: "Interview Coach",
    memeCoach: "Meme Coach",
    generateDeeperReview: "Generate deeper review",
    reviewing: "Reviewing...",
    quickReview: "Quick review",
    shareableHeadline: "Review headline",
    revealAnswer: "Reveal answer",
    hideAnswer: "Hide answer",
    answer: "Answer",
    proUnlock: "Pro training",
    proUnlockBody: "Pro adds deeper move lines, unlimited reviews, opening tags, and a custom drill queue for this mistake pattern.",
    unlockDeeper: "Unlock deeper review",
    cityIdentity: "City",
    coachLoop: "Review",
    goal: "Goal",
    instantReview: "Instant review",
    climbCityRank: "Climb the board",
    inviteRaceClock: "Invite a player and race the clock.",
    legalBotPractice: "Practice calm positions with a bot.",
    playBothSides: "Play both sides, then review.",
    noRankedGames: "No ranked games yet",
    readyToClimb: "Ready to climb in",
    everyReviewUpdates: "Each review updates your rank.",
    proDemoUpgrade: "Pro Demo",
    founderProReady: "Founder Pro ready",
    viewPro: "View Pro",
    upgradeDemo: "Activate demo",
    joinRoomByCode: "Join room by code",
    friendRoomsHelp: "Friend rooms create a shared game link and keep both boards playable for guests.",
    topPlayers: "Top players",
    arenaBoard: "Arena board",
    global: "Global",
    allTime: "All Time",
    thisWeek: "This Week",
    cityChampions: "City Champions",
    recentReviews: "Recent Reviews",
    badgesUnlock: "Badges unlock after reviewed games.",
    noTechnical: ""
  },
  ru: {
    brandTagline: "Соревновательная шахматная тренировка",
    lobby: "Лобби",
    leaderboard: "Рейтинг",
    rank: "Ранг",
    pro: "Pro",
    signIn: "Войти",
    signUp: "Регистрация",
    logout: "Выйти",
    guestProfile: "Гостевой профиль",
    founderPro: "Founder Pro",
    play: "Играть",
    friendRoom: "Комната с другом",
    trainingBot: "Тренировочный бот",
    sameDevice: "На одном устройстве",
    newGame: "Новая партия",
    rematch: "Реванш",
    resign: "Сдаться",
    draw: "Ничья",
    analyzeGame: "Разбор партии",
    gameReview: "Разбор партии",
    copyInvite: "Скопировать ссылку",
    botThinking: "Бот думает...",
    white: "Белые",
    black: "Черные",
    bullet: "Пуля",
    blitz: "Блиц",
    rapid: "Рапид",
    classical: "Классика",
    cityArenaRankings: "Рейтинг арены",
    yourRank: "Ваш ранг",
    reviewedGames: "Разобранные партии",
    currentForm: "Форма",
    startTraining: "Начать тренировку",
    playGame: "Играть",
    chooseGame: "Выберите партию",
    lobbySubtitle: "Выберите комнату с другом, тренировочного бота или игру на одном устройстве.",
    lobbyKicker: "Чистая партия, понятные часы, полезный разбор.",
    displayName: "Имя игрока",
    city: "Город",
    timeControl: "Контроль времени",
    botLevel: "Уровень бота",
    yourColor: "Ваш цвет",
    random: "Случайно",
    createFriendRoom: "Создать комнату",
    playTrainingBot: "Играть с ботом",
    playSameDevice: "Играть на одном устройстве",
    joinRoom: "Войти по коду",
    join: "Войти",
    cityRank: "Ранг в городе",
    rankSaved: "Ранг сохранен",
    progressSaved: "Прогресс сохранен",
    thisDevice: "Это устройство",
    yourMove: "Ваш ход",
    opponentsMove: "Ход соперника",
    whiteToMove: "Ход белых",
    blackToMove: "Ход черных",
    practiceGame: "Тренировочная партия",
    syncedGame: "Комната с другом",
    spectatorMode: "Наблюдение",
    waitingOpponent: "Ждем соперника",
    movesEmpty: "Ходы партии появятся после первого хода.",
    scoreSheet: "Ходы партии",
    matchPulse: "Заметки партии",
    captures: "Взятия",
    checks: "Шахи",
    phase: "Стадия",
    opening: "Дебют",
    middlegame: "Миттельшпиль",
    endgame: "Эндшпиль",
    landingTitle: "ChessCoach Arena",
    landingSubtitle: "Играйте аккуратные шахматные партии, разбирайте ключевые ошибки, тренируйтесь с ботом и поднимайтесь в рейтинге.",
    startGame: "Начать игру",
    seeProDemo: "Посмотреть Pro",
    bestDemoPath: "Лучший демо-путь: сыграйте короткую партию и откройте разбор.",
    authTitle: "Сохраняйте партии, разборы и ранг.",
    authSubtitle: "Создайте аккаунт для профиля, Pro-демо и прогресса в рейтинге.",
    playerAccount: "Аккаунт игрока",
    email: "Email",
    password: "Пароль",
    createDemoAccount: "Создать аккаунт",
    signInAndSync: "Войти",
    proTitle: "Pro превращает разбор в тренировочную привычку.",
    proSubtitle: "Глубокий разбор партии, задачи из ошибок, тренировочные карточки и аккуратный бейдж Founder. Демо без карты.",
    noRealPayment: "Без реальной оплаты",
    upgradeToProDemo: "Активировать Pro Demo",
    proActive: "Founder Pro активен",
    noReviewFound: "Разбор не найден",
    emptyCoachRoom: "Этот разбор пуст.",
    startFromLobby: "Начать из лобби",
    viewDemoReview: "Открыть демо-разбор",
    coachRoom: "Разбор партии",
    coachReview: "Тренерский разбор",
    coachVerdict: "Итог разбора",
    moveArchive: "Ходы партии",
    moveTimeline: "Лента ходов",
    whatChanged: "Что изменилось",
    materialSwing: "Баланс материала",
    phaseAdvice: "Советы по стадиям",
    deeperReview: "Углубленный разбор",
    positionDrill: "Тренировочное задание",
    keyMoment: "Ключевой момент",
    biggestMistake: "Ключевой момент",
    betterMove: "Лучший ход",
    trainingDrill: "Тренировка",
    personalizedTips: "Заметки для тренировки",
    friendlyCoach: "Дружелюбный тренер",
    strictCoach: "Строгий тренер",
    interviewCoach: "Тренер-собеседник",
    memeCoach: "Мемный тренер",
    generateDeeperReview: "Получить углубленный разбор",
    reviewing: "Разбираем...",
    quickReview: "Быстрый разбор",
    shareableHeadline: "Заголовок разбора",
    revealAnswer: "Показать ответ",
    hideAnswer: "Скрыть ответ",
    answer: "Ответ",
    proUnlock: "Pro-тренировка",
    proUnlockBody: "Pro добавляет более глубокие варианты, безлимитные разборы, дебютные метки и очередь задач под этот тип ошибки.",
    unlockDeeper: "Открыть глубокий разбор",
    cityIdentity: "Город",
    coachLoop: "Разбор",
    goal: "Цель",
    instantReview: "Мгновенный разбор",
    climbCityRank: "Подняться в рейтинге",
    inviteRaceClock: "Пригласите соперника и играйте на время.",
    legalBotPractice: "Тренируйте спокойные позиции с ботом.",
    playBothSides: "Играйте за обе стороны и разбирайте партию.",
    noRankedGames: "Рейтинговых партий пока нет",
    readyToClimb: "Вы готовы подняться в",
    everyReviewUpdates: "Каждый разбор обновляет ваш ранг.",
    proDemoUpgrade: "Pro Demo",
    founderProReady: "Founder Pro готов",
    viewPro: "Открыть Pro",
    upgradeDemo: "Активировать демо",
    joinRoomByCode: "Войти по коду комнаты",
    friendRoomsHelp: "Комната с другом создает общую ссылку и оставляет обе доски доступными для гостей.",
    topPlayers: "Лучшие игроки",
    arenaBoard: "Доска арены",
    global: "Глобально",
    allTime: "За все время",
    thisWeek: "На этой неделе",
    cityChampions: "Чемпионы города",
    recentReviews: "Последние разборы",
    badgesUnlock: "Бейджи открываются после разобранных партий.",
    noTechnical: ""
  }
} as const;

type Dictionary = typeof dictionaries.en;
type TranslationKey = keyof Dictionary;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getClientLocale, getServerLocale);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale(nextLocale) {
      window.localStorage.setItem(localeKey, nextLocale);
      window.dispatchEvent(new Event("chesscoach:locale"));
    },
    t(key) {
      return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
    }
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function subscribeLocale(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === localeKey) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("chesscoach:locale", callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("chesscoach:locale", callback);
  };
}

function getClientLocale(): Locale {
  if (typeof window === "undefined") return "ru";
  const stored = window.localStorage.getItem(localeKey);
  return stored === "ru" || stored === "en" ? stored : "ru";
}

function getServerLocale(): Locale {
  return "ru";
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: "ru" as Locale,
      setLocale: () => undefined,
      t: (key: TranslationKey) => dictionaries.ru[key] ?? dictionaries.en[key] ?? key
    };
  }
  return context;
}

export function localizeMode(mode: string, t: (key: TranslationKey) => string) {
  if (mode === "Bullet") return t("bullet");
  if (mode === "Blitz") return t("blitz");
  if (mode === "Rapid") return t("rapid");
  if (mode === "Classical") return t("classical");
  return mode;
}
