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
  task: LessonTask;
  fen: string;
};

export type LessonTask =
  | {
      type: "multiple-choice";
      question: { en: string; ru: string };
      options: Array<{ id: string; label: { en: string; ru: string } }>;
      correctAnswer: string;
      hint: { en: string; ru: string };
      explanation: { en: string; ru: string };
      successMessage: { en: string; ru: string };
      failureMessage: { en: string; ru: string };
    }
  | {
      type: "true-false";
      question: { en: string; ru: string };
      correctAnswer: boolean;
      hint: { en: string; ru: string };
      explanation: { en: string; ru: string };
      successMessage: { en: string; ru: string };
      failureMessage: { en: string; ru: string };
    }
  | {
      type: "square-select";
      question: { en: string; ru: string };
      correctSquares: string[];
      hint: { en: string; ru: string };
      explanation: { en: string; ru: string };
      successMessage: { en: string; ru: string };
      failureMessage: { en: string; ru: string };
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
        task: {
          type: "multiple-choice",
          question: { en: "Which piece moves in an L-shape?", ru: "Какая фигура ходит буквой «Г»?" },
          options: [
            { id: "knight", label: { en: "Knight", ru: "Конь" } },
            { id: "bishop", label: { en: "Bishop", ru: "Слон" } },
            { id: "rook", label: { en: "Rook", ru: "Ладья" } },
            { id: "pawn", label: { en: "Pawn", ru: "Пешка" } }
          ],
          correctAnswer: "knight",
          hint: { en: "This piece can jump over other pieces.", ru: "Эта фигура умеет перепрыгивать через другие фигуры." },
          explanation: { en: "The knight moves two squares one way and one square sideways, making an L-shape.", ru: "Конь ходит на две клетки в одну сторону и на одну вбок, поэтому получается буква «Г»." },
          successMessage: { en: "Correct. The knight is the jumper.", ru: "Верно. Конь — фигура-прыгун." },
          failureMessage: { en: "Not quite. Look for the piece that jumps.", ru: "Почти. Ищите фигуру, которая прыгает." }
        },
        fen: "rnbqkbnr/pppppppp/8/8/8/4N3/PPPPPPPP/RNBQKB1R w KQkq - 0 1"
      },
      {
        id: "captures",
        moduleId: "basics",
        xp: 20,
        title: { en: "Captures", ru: "Взятия" },
        summary: { en: "A good capture wins material or removes a defender. A bad capture invites a bigger loss.", ru: "Хорошее взятие выигрывает материал или убирает защитника. Плохое взятие ведет к большей потере." },
        coachNote: { en: "Count attackers and defenders before taking.", ru: "Считайте атакующих и защитников перед взятием." },
        task: {
          type: "square-select",
          question: { en: "Tap the white knight that can capture safely.", ru: "Нажмите на белого коня, который может взять безопасно." },
          correctSquares: ["c3"],
          hint: { en: "The knight attacks e4 and d5 from c3.", ru: "Конь с c3 атакует e4 и d5." },
          explanation: { en: "The c3 knight is developed and can take a central target without walking into a simple recapture.", ru: "Конь на c3 уже развит и может бороться за центр без простой потери." },
          successMessage: { en: "Correct. You found the active knight.", ru: "Верно. Вы нашли активного коня." },
          failureMessage: { en: "Not quite. Choose the developed white knight.", ru: "Почти. Выберите развитого белого коня." }
        },
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 3"
      },
      {
        id: "checkmate",
        moduleId: "basics",
        xp: 25,
        title: { en: "Check and checkmate", ru: "Шах и мат" },
        summary: { en: "Check is an alarm. Checkmate means the king has no safe square, block, or capture.", ru: "Шах — сигнал тревоги. Мат значит, что у короля нет ухода, защиты или взятия." },
        coachNote: { en: "Look for checks, captures, and threats in that order.", ru: "Сначала ищите шахи, затем взятия, затем угрозы." },
        task: {
          type: "true-false",
          question: { en: "Can the king ignore check and make another move?", ru: "Может ли король проигнорировать шах и сделать другой ход?" },
          correctAnswer: false,
          hint: { en: "A checked king must become safe immediately.", ru: "Король под шахом должен сразу стать в безопасности." },
          explanation: { en: "When your king is in check, your move must escape, block, or capture the attacking piece.", ru: "Если король под шахом, нужно уйти, закрыться или взять атакующую фигуру." },
          successMessage: { en: "Correct. Check must be answered.", ru: "Верно. На шах обязательно нужно ответить." },
          failureMessage: { en: "Not quite. A king may never stay in check.", ru: "Почти. Король не может оставаться под шахом." }
        },
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
        task: {
          type: "square-select",
          question: { en: "Tap one of the four central squares.", ru: "Нажмите на одно из четырех центральных полей." },
          correctSquares: ["d4", "e4", "d5", "e5"],
          hint: { en: "The center is d4, e4, d5, and e5.", ru: "Центр — это d4, e4, d5 и e5." },
          explanation: { en: "Central squares give your pieces shorter routes to both sides of the board.", ru: "Центральные поля дают фигурам короткие маршруты на оба фланга." },
          successMessage: { en: "Correct. That is a key central square.", ru: "Верно. Это важное центральное поле." },
          failureMessage: { en: "Not quite. Look at the four squares in the middle.", ru: "Почти. Посмотрите на четыре поля в середине." }
        },
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
      },
      {
        id: "develop",
        moduleId: "principles",
        xp: 25,
        title: { en: "Develop pieces", ru: "Развитие фигур" },
        summary: { en: "Bring knights and bishops into the game before chasing small material.", ru: "Выводите коней и слонов в игру до охоты за мелким материалом." },
        coachNote: { en: "One developed piece is usually worth more than one extra pawn in the opening.", ru: "В дебюте развитая фигура часто важнее одной лишней пешки." },
        task: {
          type: "multiple-choice",
          question: { en: "Which move develops a piece?", ru: "Какой ход развивает фигуру?" },
          options: [
            { id: "Nc3", label: { en: "Nc3", ru: "Кc3" } },
            { id: "a3", label: { en: "a3", ru: "a3" } },
            { id: "Qh5", label: { en: "Qh5", ru: "Фh5" } },
            { id: "h4", label: { en: "h4", ru: "h4" } }
          ],
          correctAnswer: "Nc3",
          hint: { en: "Developing usually brings a knight or bishop toward the center.", ru: "Развитие обычно выводит коня или слона ближе к центру." },
          explanation: { en: "Nc3 brings a knight into play and helps control central squares.", ru: "Кc3 вводит коня в игру и помогает контролировать центр." },
          successMessage: { en: "Correct. A piece joined the game.", ru: "Верно. Фигура вошла в игру." },
          failureMessage: { en: "Not quite. Choose the move that activates a minor piece.", ru: "Почти. Выберите ход, который активирует легкую фигуру." }
        },
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2"
      },
      {
        id: "king-safety",
        moduleId: "principles",
        xp: 30,
        title: { en: "King safety", ru: "Безопасность короля" },
        summary: { en: "A safe king lets you attack without worrying about every check.", ru: "Безопасный король позволяет атаковать и не бояться каждого шаха." },
        coachNote: { en: "Castle when the center is about to open.", ru: "Рокируйтесь, когда центр может открыться." },
        task: {
          type: "true-false",
          question: { en: "Is it usually safe to leave your king in the center for too long?", ru: "Обычно безопасно ли надолго оставлять короля в центре?" },
          correctAnswer: false,
          hint: { en: "Open center files make checks easier.", ru: "Открытые линии в центре облегчают шахи." },
          explanation: { en: "When the center opens, an uncastled king becomes an easy target.", ru: "Когда центр открывается, нерокированный король становится легкой целью." },
          successMessage: { en: "Correct. King safety comes early.", ru: "Верно. Безопасность короля важна рано." },
          failureMessage: { en: "Not quite. A central king can become exposed quickly.", ru: "Почти. Король в центре быстро может оказаться под атакой." }
        },
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
        task: {
          type: "multiple-choice",
          question: { en: "What should you check before capturing?", ru: "Что нужно проверить перед взятием?" },
          options: [
            { id: "defenders", label: { en: "Attackers and defenders", ru: "Атакующих и защитников" } },
            { id: "clock", label: { en: "Only the clock", ru: "Только часы" } },
            { id: "queen", label: { en: "Where the queen started", ru: "Где стоял ферзь в начале" } },
            { id: "rank", label: { en: "The move number only", ru: "Только номер хода" } }
          ],
          correctAnswer: "defenders",
          hint: { en: "A capture is good when the trade works for you.", ru: "Взятие хорошо, когда размен выгоден вам." },
          explanation: { en: "Counting attackers and defenders helps you avoid losing more material after a capture.", ru: "Подсчет атакующих и защитников помогает не потерять больше материала после взятия." },
          successMessage: { en: "Correct. Count before you take.", ru: "Верно. Сначала считайте, потом берите." },
          failureMessage: { en: "Not quite. Think about what can recapture.", ru: "Почти. Подумайте, кто сможет взять в ответ." }
        },
        fen: "r2qkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5"
      },
      {
        id: "opening-principles",
        moduleId: "tactics",
        xp: 30,
        title: { en: "Opening principles", ru: "Дебютные принципы" },
        summary: { en: "Do not bring the queen out early unless there is a concrete reason.", ru: "Не выводите ферзя рано без конкретной причины." },
        coachNote: { en: "Develop, castle, then look for queen activity.", ru: "Развейтесь, рокируйтесь, потом ищите активность ферзя." },
        task: {
          type: "multiple-choice",
          question: { en: "Why can early queen moves be risky?", ru: "Почему ранние ходы ферзем могут быть рискованными?" },
          options: [
            { id: "tempo", label: { en: "The queen can be chased while rivals develop", ru: "Ферзя гоняют, а соперник развивается" } },
            { id: "illegal", label: { en: "The queen cannot move before move 10", ru: "Ферзь не может ходить до 10-го хода" } },
            { id: "weak", label: { en: "The queen moves like a pawn", ru: "Ферзь ходит как пешка" } },
            { id: "draw", label: { en: "It immediately makes a draw", ru: "Это сразу делает ничью" } }
          ],
          correctAnswer: "tempo",
          hint: { en: "A developed piece can attack the queen with tempo.", ru: "Развитая фигура может нападать на ферзя с темпом." },
          explanation: { en: "If the queen comes out too early, opponents often gain time by attacking it while improving pieces.", ru: "Если ферзь выходит слишком рано, соперник часто выигрывает темпы, нападая на него и развивая фигуры." },
          successMessage: { en: "Correct. Development first, queen later.", ru: "Верно. Сначала развитие, ферзь позже." },
          failureMessage: { en: "Not quite. Early queen moves often lose time.", ru: "Почти. Ранние ходы ферзем часто теряют темп." }
        },
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
      },
      {
        id: "fork",
        moduleId: "tactics",
        xp: 35,
        title: { en: "Fork", ru: "Вилка" },
        summary: { en: "A fork attacks two targets at once. Knights are especially good at it.", ru: "Вилка атакует две цели сразу. Особенно часто ее делает конь." },
        coachNote: { en: "Look for checks that also attack a loose piece.", ru: "Ищите шахи, которые одновременно атакуют фигуру." },
        task: {
          type: "square-select",
          question: { en: "Tap the knight that can create a fork.", ru: "Нажмите на коня, который может создать вилку." },
          correctSquares: ["c3", "f3"],
          hint: { en: "Knights are the classic fork pieces.", ru: "Конь — классическая фигура для вилки." },
          explanation: { en: "A knight can attack two valuable targets at once because its L-shape is hard to block.", ru: "Конь может атаковать две ценные цели сразу, потому что его ход буквой «Г» нельзя закрыть." },
          successMessage: { en: "Correct. That knight has fork potential.", ru: "Верно. У этого коня есть идея вилки." },
          failureMessage: { en: "Not quite. Look for a knight with central jumps.", ru: "Почти. Ищите коня с прыжками в центр." }
        },
        fen: "r3k2r/ppp2ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R3K2R w KQkq - 0 1"
      },
      {
        id: "mate-one",
        moduleId: "tactics",
        xp: 35,
        title: { en: "Mate in one", ru: "Мат в один" },
        summary: { en: "When the king is trapped, one forcing move can finish the game.", ru: "Когда король заперт, один форсированный ход может завершить партию." },
        coachNote: { en: "Check every forcing move before you settle for material.", ru: "Проверьте все форсированные ходы до взятия материала." },
        task: {
          type: "multiple-choice",
          question: { en: "What does Qh8# mean?", ru: "Что означает Фh8#?" },
          options: [
            { id: "mate", label: { en: "Queen moves to h8 and gives checkmate", ru: "Ферзь идет на h8 и ставит мат" } },
            { id: "castle", label: { en: "White castles long", ru: "Белые рокируются в длинную сторону" } },
            { id: "capture", label: { en: "A pawn captures on h8", ru: "Пешка берет на h8" } },
            { id: "draw", label: { en: "The game is drawn", ru: "Партия заканчивается ничьей" } }
          ],
          correctAnswer: "mate",
          hint: { en: "The # symbol means checkmate.", ru: "Символ # означает мат." },
          explanation: { en: "In notation, Q is queen, h8 is the destination square, and # marks checkmate.", ru: "В нотации Ф — ферзь, h8 — поле назначения, а # означает мат." },
          successMessage: { en: "Correct. You read the mating move.", ru: "Верно. Вы прочитали матующий ход." },
          failureMessage: { en: "Not quite. Focus on the # symbol.", ru: "Почти. Обратите внимание на символ #." }
        },
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
