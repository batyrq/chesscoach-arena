"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type Locale = "ru" | "en";

const localeKey = "chesscoach.locale";

const dictionaries = {
  en: {
    brandTagline: "City-ranked chess training",
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
    analyzeGame: "Analyze Game",
    gameReview: "Game Review",
    copyInvite: "Copy invite link",
    botThinking: "Bot is thinking...",
    white: "White",
    black: "Black",
    bullet: "Bullet",
    blitz: "Blitz",
    rapid: "Rapid",
    classical: "Classical",
    cityArenaRankings: "City Arena Rankings",
    yourRank: "Your Rank",
    reviewedGames: "Reviewed Games",
    currentForm: "Current Form",
    startTraining: "Start Training",
    playGame: "Play a Game",
    chooseGame: "Choose your game",
    lobbySubtitle: "Play a friend, train against a bot, or review your progress.",
    lobbyKicker: "Fast games. Clear reviews. City rankings.",
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
    whiteToMove: "White to move.",
    blackToMove: "Black to move.",
    practiceGame: "Practice game",
    syncedGame: "Friend room",
    spectatorMode: "Spectating",
    waitingOpponent: "Waiting for opponent.",
    movesEmpty: "Moves will appear here after the first move.",
    scoreSheet: "Score sheet",
    matchPulse: "Match pulse",
    captures: "Captures",
    checks: "Checks",
    phase: "Phase",
    opening: "Opening",
    middlegame: "Middle",
    endgame: "Endgame",
    landingTitle: "Play chess. Review mistakes. Climb your city.",
    landingSubtitle: "ChessCoach Arena is a calm chess platform for friend games, training bots, coach reviews, blunder puzzles, and city rankings.",
    startGame: "Start Game",
    seeProDemo: "See Pro Demo",
    bestDemoPath: "Best demo path: play a short game, then open the Game Review.",
    authTitle: "Save your coach history and city rank.",
    authSubtitle: "Create a demo account, keep Pro status across devices, and continue your leaderboard climb.",
    playerAccount: "Player account",
    email: "Email",
    password: "Password",
    createDemoAccount: "Create demo account",
    signInAndSync: "Sign in and sync",
    proTitle: "Pro turns review into a training routine.",
    proSubtitle: "Deeper coach review, blunder puzzles, training drills, and a Founder badge. Demo only, no card required.",
    noRealPayment: "No real payment",
    upgradeToProDemo: "Upgrade to Pro Demo",
    proActive: "Founder Pro active",
    noTechnical: ""
  },
  ru: {
    brandTagline: "Городской шахматный рейтинг",
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
    black: "Чёрные",
    bullet: "Пуля",
    blitz: "Блиц",
    rapid: "Рапид",
    classical: "Классика",
    cityArenaRankings: "Городская арена",
    yourRank: "Ваш ранг",
    reviewedGames: "Разобранные партии",
    currentForm: "Форма",
    startTraining: "Начать тренировку",
    playGame: "Играть",
    chooseGame: "Выберите партию",
    lobbySubtitle: "Играйте с другом, тренируйтесь с ботом или разбирайте прогресс.",
    lobbyKicker: "Быстрые партии. Понятный разбор. Рейтинг города.",
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
    rankSaved: "Ранг сохранён",
    progressSaved: "Прогресс сохранён",
    thisDevice: "Это устройство",
    yourMove: "Ваш ход",
    opponentsMove: "Ход соперника",
    whiteToMove: "Ход белых.",
    blackToMove: "Ход чёрных.",
    practiceGame: "Тренировочная партия",
    syncedGame: "Комната с другом",
    spectatorMode: "Наблюдение",
    waitingOpponent: "Ожидаем соперника.",
    movesEmpty: "Ходы появятся здесь после первого хода.",
    scoreSheet: "Протокол",
    matchPulse: "Пульс партии",
    captures: "Взятия",
    checks: "Шахи",
    phase: "Стадия",
    opening: "Дебют",
    middlegame: "Миттельшпиль",
    endgame: "Эндшпиль",
    landingTitle: "Играйте. Разбирайте ошибки. Поднимайтесь в городе.",
    landingSubtitle: "ChessCoach Arena — спокойная шахматная платформа для партий с друзьями, тренировок с ботом, разбора, задач из ошибок и городского рейтинга.",
    startGame: "Начать игру",
    seeProDemo: "Посмотреть Pro",
    bestDemoPath: "Лучший демо-путь: сыграйте короткую партию и откройте разбор.",
    authTitle: "Сохраняйте историю разбора и городской ранг.",
    authSubtitle: "Создайте демо-аккаунт, переносите Pro-статус между устройствами и продолжайте подъём в рейтинге.",
    playerAccount: "Аккаунт игрока",
    email: "Email",
    password: "Пароль",
    createDemoAccount: "Создать демо-аккаунт",
    signInAndSync: "Войти и синхронизировать",
    proTitle: "Pro превращает разбор в тренировку.",
    proSubtitle: "Глубокий разбор, задачи из ошибок, тренировочные планы и бейдж Founder. Демо без карты и оплаты.",
    noRealPayment: "Без реальной оплаты",
    upgradeToProDemo: "Активировать Pro Demo",
    proActive: "Founder Pro активен",
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
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "ru";
    const stored = window.localStorage.getItem(localeKey);
    return stored === "ru" || stored === "en" ? stored : "ru";
  });

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale(nextLocale) {
      setLocaleState(nextLocale);
      window.localStorage.setItem(localeKey, nextLocale);
    },
    t(key) {
      return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
    }
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
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
