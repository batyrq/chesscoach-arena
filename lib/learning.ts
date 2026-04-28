export type LessonId =
  | "pieces-move"
  | "captures"
  | "checkmate"
  | "center"
  | "develop"
  | "king-safety"
  | "undefended"
  | "opening-principles"
  | "fork"
  | "mate-one";

export type LessonModule = {
  id: string;
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  lessons: Lesson[];
};

export type Lesson = {
  id: LessonId;
  moduleId: string;
  xp: number;
  title: { en: string; ru: string };
  summary: { en: string; ru: string };
  coachNote: { en: string; ru: string };
  task: { en: string; ru: string };
  fen: string;
};

export const learningModules: LessonModule[] = [
  {
    id: "basics",
    title: { en: "Basics", ru: "Основы" },
    description: { en: "Learn the board, captures, and checkmate ideas.", ru: "Разберитесь с доской, взятиями и идеей мата." },
    lessons: [
      {
        id: "pieces-move",
        moduleId: "basics",
        xp: 20,
        title: { en: "How pieces move", ru: "Как ходят фигуры" },
        summary: { en: "Every piece has a job. Start by spotting how knights, bishops, rooks, queens, kings, and pawns travel.", ru: "У каждой фигуры своя работа. Начните с ходов коня, слона, ладьи, ферзя, короля и пешки." },
        coachNote: { en: "Before every move, ask: which piece improves safely?", ru: "Перед ходом спросите себя: какая фигура улучшится безопасно?" },
        task: { en: "Find the knight that can jump toward the center.", ru: "Найдите коня, который может прыгнуть к центру." },
        fen: "rnbqkbnr/pppppppp/8/8/8/4N3/PPPPPPPP/RNBQKB1R w KQkq - 0 1"
      },
      {
        id: "captures",
        moduleId: "basics",
        xp: 20,
        title: { en: "Captures", ru: "Взятия" },
        summary: { en: "A good capture wins material or removes a defender. A bad capture invites a bigger loss.", ru: "Хорошее взятие выигрывает материал или убирает защитника. Плохое взятие ведет к большей потере." },
        coachNote: { en: "Count attackers and defenders before taking.", ru: "Считайте атакующих и защитников перед взятием." },
        task: { en: "Which white piece can capture safely?", ru: "Какая белая фигура может взять безопасно?" },
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3"
      },
      {
        id: "checkmate",
        moduleId: "basics",
        xp: 25,
        title: { en: "Check and checkmate", ru: "Шах и мат" },
        summary: { en: "Check is an alarm. Checkmate means the king has no safe square, block, or capture.", ru: "Шах — сигнал тревоги. Мат значит, что у короля нет ухода, защиты или взятия." },
        coachNote: { en: "Look for checks, captures, and threats in that order.", ru: "Сначала ищите шахи, затем взятия, затем угрозы." },
        task: { en: "Find the checking move that controls escape squares.", ru: "Найдите шах, который контролирует поля отхода." },
        fen: "6k1/5ppp/8/8/8/8/5PPP/5RK1 w - - 0 1"
      }
    ]
  },
  {
    id: "principles",
    title: { en: "First principles", ru: "Первые принципы" },
    description: { en: "Build healthy openings without memorizing lines.", ru: "Стройте здоровый дебют без зубрежки вариантов." },
    lessons: [
      {
        id: "center",
        moduleId: "principles",
        xp: 25,
        title: { en: "Control the center", ru: "Контроль центра" },
        summary: { en: "Central squares help pieces reach both sides quickly.", ru: "Центральные поля помогают фигурам быстро попадать на оба фланга." },
        coachNote: { en: "A center pawn move often opens two pieces at once.", ru: "Ход центральной пешкой часто открывает сразу две фигуры." },
        task: { en: "Choose a move that fights for d4, e4, d5, or e5.", ru: "Выберите ход, который борется за d4, e4, d5 или e5." },
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
      },
      {
        id: "develop",
        moduleId: "principles",
        xp: 25,
        title: { en: "Develop pieces", ru: "Развитие фигур" },
        summary: { en: "Bring knights and bishops into the game before chasing small material.", ru: "Выводите коней и слонов в игру до охоты за мелким материалом." },
        coachNote: { en: "One developed piece is usually worth more than one extra pawn in the opening.", ru: "В дебюте развитая фигура часто важнее одной лишней пешки." },
        task: { en: "Find a developing move for White.", ru: "Найдите развивающий ход за белых." },
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2"
      },
      {
        id: "king-safety",
        moduleId: "principles",
        xp: 30,
        title: { en: "King safety", ru: "Безопасность короля" },
        summary: { en: "A safe king lets you attack without worrying about every check.", ru: "Безопасный король позволяет атаковать и не бояться каждого шаха." },
        coachNote: { en: "Castle when the center is about to open.", ru: "Рокируйтесь, когда центр может открыться." },
        task: { en: "What move gets the king closer to safety?", ru: "Какой ход приближает короля к безопасности?" },
        fen: "rnbqk2r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
      }
    ]
  },
  {
    id: "tactics",
    title: { en: "Tactics starter", ru: "Старт тактики" },
    description: { en: "Catch loose pieces and simple forcing ideas.", ru: "Замечайте незащищенные фигуры и простые форсированные идеи." },
    lessons: [
      {
        id: "undefended",
        moduleId: "tactics",
        xp: 30,
        title: { en: "Defending your pieces", ru: "Защита фигур" },
        summary: { en: "Most beginner losses come from pieces left undefended.", ru: "Большинство потерь у новичков начинается с незащищенных фигур." },
        coachNote: { en: "After your move, check whether every attacked piece is protected.", ru: "После хода проверьте, защищена ли каждая атакованная фигура." },
        task: { en: "Spot the loose piece before moving.", ru: "Найдите незащищенную фигуру перед ходом." },
        fen: "r2qkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5"
      },
      {
        id: "opening-principles",
        moduleId: "tactics",
        xp: 30,
        title: { en: "Opening principles", ru: "Дебютные принципы" },
        summary: { en: "Do not bring the queen out early unless there is a concrete reason.", ru: "Не выводите ферзя рано без конкретной причины." },
        coachNote: { en: "Develop, castle, then look for queen activity.", ru: "Развейтесь, рокируйтесь, потом ищите активность ферзя." },
        task: { en: "Choose development instead of an early queen move.", ru: "Выберите развитие вместо раннего хода ферзем." },
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
      },
      {
        id: "fork",
        moduleId: "tactics",
        xp: 35,
        title: { en: "Fork", ru: "Вилка" },
        summary: { en: "A fork attacks two targets at once. Knights are especially good at it.", ru: "Вилка атакует две цели сразу. Особенно часто ее делает конь." },
        coachNote: { en: "Look for checks that also attack a loose piece.", ru: "Ищите шахи, которые одновременно атакуют фигуру." },
        task: { en: "Find a knight move that attacks king and rook.", ru: "Найдите ход конем с атакой на короля и ладью." },
        fen: "r3k2r/ppp2ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R3K2R w KQkq - 0 1"
      },
      {
        id: "mate-one",
        moduleId: "tactics",
        xp: 35,
        title: { en: "Mate in one", ru: "Мат в один" },
        summary: { en: "When the king is trapped, one forcing move can finish the game.", ru: "Когда король заперт, один форсированный ход может завершить партию." },
        coachNote: { en: "Check every forcing move before you settle for material.", ru: "Проверьте все форсированные ходы до взятия материала." },
        task: { en: "Find the checkmate in one move.", ru: "Найдите мат в один ход." },
        fen: "6k1/5ppp/8/8/8/8/5PPP/6KQ w - - 0 1"
      }
    ]
  }
];

export const lessons = learningModules.flatMap((module) => module.lessons);

export function getLessonById(id: string | null | undefined) {
  return lessons.find((lesson) => lesson.id === id) ?? lessons[0];
}

export function getNextLessonId(completedLessons: string[]) {
  return lessons.find((lesson) => !completedLessons.includes(lesson.id))?.id ?? lessons.at(-1)?.id ?? "pieces-move";
}

export function getLessonIndex(id: string) {
  return lessons.findIndex((lesson) => lesson.id === id);
}

export function localText(value: { en: string; ru: string }, locale: "en" | "ru") {
  return value[locale];
}
