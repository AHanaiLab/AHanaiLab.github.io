const datasets = [
    {
        id: "general",
        title: "一般常識",
        description: "日々の生活やニュースで耳にする一般的な知識を問うクイズです。",
        questions: [
            {
                question: "日本で一番高い山は富士山ですが、二番目に高い山は何でしょう？",
                choices: ["北岳", "奥穂高岳", "間ノ岳", "槍ヶ岳"],
                correctIndex: 0,
                explanation: "北岳は標高3193mで、日本で二番目に高い山です。ちなみに三番目は奥穂高岳と間ノ岳が同率です。"
            },
            {
                question: "「陸上の短距離走」において、スタートの合図より早く飛び出してしまう反則を何というでしょう？",
                choices: ["フライング", "フォルス・スタート", "バッド・スタート", "アーリー・スタート"],
                correctIndex: 1,
                explanation: "一般的には「フライング」と呼ばれますが、正式名称は「不正出発（フォルス・スタート）」です。"
            },
            {
                question: "元素記号「Fe」で表される金属は何でしょう？",
                choices: ["銅", "銀", "金", "鉄"],
                correctIndex: 3,
                explanation: "Feはラテン語のFerrumに由来します。"
            },
            {
                question: "ことわざ「急がば回れ」の由来となった場所はどこでしょう？",
                choices: ["琵琶湖", "富士山", "箱根駅伝のコース", "東海道"],
                correctIndex: 0,
                explanation: "琵琶湖を船で渡る急なルートか、陸路で回る安全なルートか、という歌が由来です。"
            },
            {
                question: "ピアノの鍵盤の数は、一般的なものでいくつあるでしょう？",
                choices: ["66", "77", "88", "99"],
                correctIndex: 2,
                explanation: "白鍵52、黒鍵36の合計88鍵が一般的です。"
            }
        ]
    },
    {
        id: "it_trivia",
        title: "ITトリビア",
        description: "コンピュータやインターネットに関する豆知識クイズです。",
        questions: [
            {
                question: "プログラミング言語「Python」の名前の由来は何でしょう？",
                choices: ["蛇のパイソン", "コメディ番組", "開発者のペット", "ギリシャ神話"],
                correctIndex: 1,
                explanation: "イギリスのコメディ番組「空飛ぶモンティ・パイソン」が由来です。"
            },
            {
                question: "Webページのスタイルを指定する「CSS」は何の略でしょう？",
                choices: ["Computer Style Sheet", "Creative Style System", "Cascading Style Sheets", "Colorful Style Sheets"],
                correctIndex: 2,
                explanation: "Cascading（滝のように流れる、継承する）Style Sheetsの略です。"
            },
            {
                question: "世界初のコンピュータウイルスと言われているものは何でしょう？",
                choices: ["Creeper", "Reaper", "Brain", "Morris"],
                correctIndex: 0,
                explanation: "1971年に作成された「Creeper」が世界初と言われています。「I'm the creeper, catch me if you can!」と表示するだけのものでした。"
            }
        ]
    },
    {
        id: "history",
        title: "歴史雑学",
        description: "世界の歴史や日本の歴史に関するクイズです。",
        questions: [
            {
                question: "1600年に関ヶ原の戦いが起きた時の天気はどうだったと言われているでしょう？",
                choices: ["快晴", "霧", "大雨", "雪"],
                correctIndex: 1,
                explanation: "当日の朝は濃い霧が出ており、視界が悪かったと言われています。"
            },
            {
                question: "アメリカの初代大統領は誰でしょう？",
                choices: ["リンカーン", "ケネディ", "ワシントン", "ジェファーソン"],
                correctIndex: 2,
                explanation: "ジョージ・ワシントンです。"
            }
        ]
    }
];
