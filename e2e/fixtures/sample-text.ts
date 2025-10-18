/**
 * Sample text fixture for E2E flashcard generation tests
 */
export const SAMPLE_TEXT = `
Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments. During photosynthesis in green plants, light energy is captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds. It is arguably the most important biochemical pathway known; nearly all life depends on it.

The process occurs in two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). The light-dependent reactions take place in the thylakoid membranes of chloroplasts where chlorophyll and other light-absorbing pigments capture light energy and convert it into chemical energy in the form of ATP and NADPH. These energy carriers are then used in the Calvin cycle, which takes place in the stroma of the chloroplast.

In the Calvin cycle, carbon dioxide is fixed into organic molecules through a series of enzyme-mediated reactions. The cycle begins with the enzyme RuBisCO catalyzing the attachment of CO2 to a five-carbon sugar called ribulose bisphosphate (RuBP). This process is called carbon fixation. The resulting six-carbon compound immediately splits into two three-carbon molecules called 3-phosphoglycerate (3-PGA).

The rate of photosynthesis can be affected by several environmental factors including light intensity, carbon dioxide concentration, temperature, and water availability. When any of these factors becomes limiting, the rate of photosynthesis decreases. Understanding these factors is crucial for optimizing crop yields in agriculture and understanding ecosystem productivity in ecology.
`.trim();

/**
 * Mock response for successful flashcard generation
 */
export const MOCK_GENERATION_RESPONSE = {
  batch_id: "test-batch-123",
  generated_cards: [
    {
      index: 0,
      front_text: "What is photosynthesis?",
      back_text: "The process by which green plants use sunlight to synthesize foods with the help of chlorophyll pigments, converting water, CO2, and minerals into oxygen and energy-rich organic compounds.",
    },
    {
      index: 1,
      front_text: "What are the two main stages of photosynthesis?",
      back_text: "The light-dependent reactions and the light-independent reactions (Calvin cycle).",
    },
    {
      index: 2,
      front_text: "Where do light-dependent reactions take place?",
      back_text: "In the thylakoid membranes of chloroplasts where chlorophyll captures light energy and converts it into ATP and NADPH.",
    },
    {
      index: 3,
      front_text: "What happens during the Calvin cycle?",
      back_text: "Carbon dioxide is fixed into organic molecules through enzyme-mediated reactions in the stroma of the chloroplast.",
    },
    {
      index: 4,
      front_text: "What environmental factors affect the rate of photosynthesis?",
      back_text: "Light intensity, carbon dioxide concentration, temperature, and water availability.",
    },
  ],
};

/**
 * Mock response for successful review submission
 */
export const MOCK_REVIEW_RESPONSE = {
  batch_id: "test-batch-123",
  cards_accepted: 3,
  cards_edited: 1,
  cards_rejected: 1,
};

