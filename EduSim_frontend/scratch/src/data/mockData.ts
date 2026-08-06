export const MOCK_TUTOR_RESPONSES = [
  {
    topic: "Newton's Second Law",
    explanation: "# Newton's Second Law of Motion\n\nThe acceleration of an object as produced by a net force is **directly proportional** to the magnitude of the net force, in the same direction as the net force, and **inversely proportional** to the mass of the object.\n\n### The Formula\n$$F = m \\times a$$\n\nWhere:\n- **F** is the net force acting upon the object\n- **m** is the mass of the object\n- **a** is the acceleration of the object",
    concepts: ["Force", "Mass", "Acceleration", "Inertia"],
    formulas: [
      { name: "Force", formula: "F = m*a", topic: "Dynamics", meaning: "Force equals mass times acceleration." },
      { name: "Acceleration", formula: "a = F/m", topic: "Dynamics", meaning: "Acceleration is force divided by mass." }
    ],
    ragContent: [
      { title: "Principia Mathematica", content: "Lex II: Mutationem motus proportionalem esse vi motrici impressae..." }
    ]
  },
  {
    topic: "Gravity",
    explanation: "# Universal Gravitation\n\nEvery particle attracts every other particle in the universe with a force that is directly proportional to the product of their masses and inversely proportional to the square of the distance between their centers.\n\n### The Formula\n$$F = G \\frac{m_1 m_2}{r^2}$$\n\nThis law applies to everything from apples falling from trees to planets orbiting stars.",
    concepts: ["Gravitation", "Mass", "Distance", "Inverse Square Law"],
    formulas: [
      { name: "Gravitational Force", formula: "F = G*(m1*m2)/r^2", topic: "Gravitation", meaning: "The force between two masses." }
    ],
    ragContent: [
      { title: "Astrophysics Journal", content: "Gravity is the weakest of the four fundamental forces but dominates at large scales." }
    ]
  }
];

export const MOCK_SIMULATIONS = [
  {
    id: "sim_1",
    title: "Projectile Motion Experiment",
    subject: "Physics",
    createdAt: new Date().toISOString(),
    favorite: true,
    type: "dsl",
    simulation: { /* Mock DSL */ }
  },
  {
    id: "sim_2",
    title: "Acid-Base Titration",
    subject: "Chemistry",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    favorite: false,
    type: "html",
    simulation: "<html><body>Mock Chem Sim</body></html>"
  }
];

export const MOCK_ANALYTICS = {
  totalSimulations: 24,
  timeSpent: "12.5h",
  conceptsMastered: 18,
  weeklyStreak: 5,
  activityData: [40, 70, 45, 90, 65, 30, 50],
  subjectDistribution: [
    { name: "Physics", percentage: 65, color: "purple" },
    { name: "Chemistry", percentage: 25, color: "cyan" },
    { name: "Math", percentage: 10, color: "blue" }
  ]
};
