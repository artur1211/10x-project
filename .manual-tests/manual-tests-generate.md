# Quick Start Guide for Testing Flashcard Generation Endpoint

## Prerequisites

1. **Install HTTPie** (if not already installed):
   ```bash
   # macOS
   brew install httpie

   # or using pip
   pip install httpie
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

## Quick Test Flow

### Valid Request (Success Case)

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="Photosynthesis is the process by which plants convert light energy into chemical energy. This process occurs in the chloroplasts of plant cells and involves two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). During the light-dependent reactions, chlorophyll and other pigments absorb light energy, which is used to split water molecules and produce ATP and NADPH. These energy-rich molecules are then used in the Calvin cycle to convert carbon dioxide into glucose. The overall equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process is essential for life on Earth as it produces oxygen and serves as the foundation of most food chains. Plants, algae, and certain bacteria are capable of photosynthesis. The efficiency of photosynthesis varies depending on factors such as light intensity, carbon dioxide concentration, temperature, and water availability. Understanding photosynthesis is crucial for agriculture, climate science, and developing sustainable energy solutions. Researchers continue to study this complex process to improve crop yields and develop artificial photosynthesis technologies."
```

**Expected Result**: 201 Created with `batch_id` in response

## Test Categories

### ✅ Valid Requests (201 Created)

#### TEST 1: Valid request with minimum length text (1000 characters)

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="Photosynthesis is the process by which plants convert light energy into chemical energy. This process occurs in the chloroplasts of plant cells and involves two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). During the light-dependent reactions, chlorophyll and other pigments absorb light energy, which is used to split water molecules and produce ATP and NADPH. These energy-rich molecules are then used in the Calvin cycle to convert carbon dioxide into glucose. The overall equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process is essential for life on Earth as it produces oxygen and serves as the foundation of most food chains. Plants, algae, and certain bacteria are capable of photosynthesis. The efficiency of photosynthesis varies depending on factors such as light intensity, carbon dioxide concentration, temperature, and water availability. Understanding photosynthesis is crucial for agriculture, climate science, and developing sustainable energy solutions. Researchers continue to study this complex process to improve crop yields and develop artificial photosynthesis technologies."
```

#### TEST 2: Valid request with longer text (2000+ characters)

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="The Pythagorean theorem states that in a right-angled triangle, the square of the length of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the lengths of the other two sides. This can be written as a² + b² = c², where c represents the length of the hypotenuse and a and b represent the lengths of the other two sides. This fundamental theorem has numerous applications in mathematics, physics, engineering, and everyday life. It was known to ancient civilizations, including the Babylonians and Indians, but is named after the Greek mathematician Pythagoras who lived around 570-495 BCE. The theorem can be proven in many different ways - over 400 proofs have been documented throughout history. One of the most elegant proofs involves rearranging four identical right triangles within two squares of equal area. In three-dimensional space, the theorem extends to the relationship between the diagonal of a rectangular box and its sides. The distance formula in coordinate geometry is a direct application of the Pythagorean theorem. In physics, it's used to calculate resultant vectors and in navigation for determining distances. The theorem also forms the basis for trigonometric identities and is fundamental to Euclidean geometry. Modern applications include computer graphics, GPS technology, architecture, and construction. The Pythagorean theorem demonstrates the beauty and universality of mathematical truths, remaining as relevant today as it was thousands of years ago. Students worldwide learn this theorem as one of their first encounters with mathematical proof and abstract reasoning. Its simplicity and power make it one of the most important theorems in all of mathematics, serving as a gateway to more advanced concepts in geometry, algebra, and beyond."
```

#### TEST 10: Valid request with maximum length text (10000 characters)

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="$(python3 -c "print('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ' * 20)")"
```

### ❌ Validation Errors (400 Bad Request)

#### TEST 3: Invalid - text too short (less than 1000 characters)

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="This text is too short. It only contains a few hundred characters when the API requires at least 1000 characters. This should trigger a validation error from the Zod schema. Adding more text here to make it longer but still under the 1000 character minimum requirement for the input_text field. The API should return a 400 Bad Request status with validation error details."
```

**Expected Result**: 400 Bad Request with validation error

#### TEST 4: Invalid - empty text

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text=""
```

**Expected Result**: 400 Bad Request with validation error

#### TEST 5: Invalid - missing input_text field

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  wrong_field="Some text here"
```

**Expected Result**: 400 Bad Request with validation error

#### TEST 6: Invalid - null input_text

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text:=null
```

**Expected Result**: 400 Bad Request with validation error

#### TEST 7: Invalid - input_text is not a string

```bash
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text:=12345
```

**Expected Result**: 400 Bad Request with validation error

#### TEST 9: Invalid - malformed JSON

Note: This test is difficult to execute with HTTPie as it validates JSON before sending. You can test this with curl:

```bash
curl -X POST http://localhost:3000/api/flashcards/batch \
  -H "Content-Type: application/json" \
  -d '{"input_text": "Valid text",}'
```

**Expected Result**: 400 Bad Request with JSON parse error

## Useful Commands

### Pretty print JSON output
```bash
http POST ... | jq '.'
```

### Show response headers
```bash
http -v POST ...
```

### Generate test text with specific character count
```bash
# 1000 characters
python3 -c "print('a' * 1000)"

# 2000 characters
python3 -c "print('test content ' * 150)"
```

### Save batch_id to variable for later use
```bash
BATCH_ID=$(http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="$(python3 -c "print('a' * 1000)")" | jq -r '.batch_id')

echo "Generated batch: $BATCH_ID"
```

## Example Test Workflow

```bash
# 1. Test with valid minimum length text
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="$(python3 -c "print('a' * 1000)")"

# 2. Test with valid longer text (capture batch_id)
BATCH_ID=$(http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="$(python3 -c "print('Educational content about science. ' * 100)")" | jq -r '.batch_id')

echo "Generated batch: $BATCH_ID"

# 3. Test with too short text (should fail)
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text="Too short"

# 4. Test with empty text (should fail)
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  input_text=""

# 5. Test with missing field (should fail)
http POST http://localhost:3000/api/flashcards/batch \
  Content-Type:application/json \
  wrong_field="Some text"
```

## Common Issues

### Issue: "Text must be at least 1000 characters"
- **Solution**: Ensure your `input_text` is at least 1000 characters long
- **Check**: Use `python3 -c "print('a' * 1000)"` to generate valid length text
- **Tip**: For meaningful tests, repeat educational content instead of single characters

### Issue: "Missing required field input_text"
- **Solution**: Make sure you're using `input_text` as the field name
- **Check**: Verify the JSON structure matches `{"input_text": "your text here"}`

### Issue: "Invalid JSON"
- **Solution**: Check for trailing commas, unquoted strings, or other JSON syntax errors
- **Note**: HTTPie handles JSON formatting automatically, but curl requires valid JSON

### Issue: Response shows 404 instead of validation error
- **Solution**: Verify the endpoint URL is correct: `/api/flashcards/batch`
- **Check**: Ensure the development server is running on port 3000

## Verification Checklist

- [ ] Generate endpoint accepts valid 1000+ character text (201)
- [ ] Generate endpoint returns valid batch_id UUID
- [ ] Endpoint rejects text shorter than 1000 characters (400)
- [ ] Endpoint rejects empty text (400)
- [ ] Endpoint rejects missing input_text field (400)
- [ ] Endpoint rejects null input_text (400)
- [ ] Endpoint rejects non-string input_text (400)
- [ ] Endpoint handles malformed JSON gracefully (400)
- [ ] Response includes proper status codes
- [ ] Response includes descriptive error messages for validation failures

## Response Format

### Success Response (201 Created)
```json
{
  "batch_id": "c4ce0392-19df-4181-a16c-84884cbb3cad",
  "status": "pending",
  "created_at": "2025-10-09T12:00:00Z"
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "input_text",
      "message": "String must contain at least 1000 character(s)"
    }
  ]
}
```
