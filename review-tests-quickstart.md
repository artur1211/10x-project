# Quick Start Guide for Testing Review Endpoint

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

### Step 1: Generate a Batch

```bash
http POST http://localhost:3000/api/flashcards/generate \
  Content-Type:application/json \
  input_text="$(python3 -c "print('a' * 1000)")"
```

**Copy the `batch_id` from the response!**

### Step 2: Test Review Endpoint (Success Case)

Replace `{BATCH_ID}` with your actual batch ID:

```bash
http POST http://localhost:3000/api/flashcards/batch/{BATCH_ID}/review \
  Content-Type:application/json \
  decisions:='[
    {
      "index": 0,
      "action": "accept",
      "front_text": "Sample flashcard question 1",
      "back_text": "Sample flashcard answer 1"
    },
    {
      "index": 1,
      "action": "edit",
      "front_text": "Edited question with better clarity",
      "back_text": "Edited answer with more detailed explanation"
    },
    {
      "index": 2,
      "action": "reject",
      "front_text": "Sample flashcard question 3",
      "back_text": "Sample flashcard answer 3"
    }
  ]'
```

**Expected Result**: 201 Created with `cards_accepted: 2`, `cards_rejected: 1`, `cards_edited: 1`

## Test Categories

### ✅ Valid Requests (201 Created)
- **TEST 1-4**: Accept all, mixed actions, reject all, partial review

### ❌ Validation Errors (400 Bad Request)
- **TEST 5**: Invalid UUID format
- **TEST 6**: Empty decisions array
- **TEST 7-10**: Text length violations
- **TEST 11**: Invalid action value
- **TEST 12-14**: Index validation (negative, out of bounds, duplicates)
- **TEST 15-16**: Malformed JSON and missing fields

### 🔍 Not Found (404)
- **TEST 17**: Non-existent batch ID

### ⚠️ Conflict (409)
- **TEST 18**: Review same batch twice

### 🚫 Forbidden (403)
- **TEST 19**: Exceed 500 flashcard limit

## Useful Commands

### Pretty print JSON output
```bash
http POST ... | jq '.'
```

### Show response headers
```bash
http -v POST ...
```

### Generate multiple batches quickly
```bash
for i in {1..5}; do
  http POST http://localhost:3000/api/flashcards/generate \
    Content-Type:application/json \
    input_text="$(python3 -c "print('Test batch $i. ' * 100)")"
  sleep 1
done
```

### Extract batch_id automatically (requires jq)
```bash
BATCH_ID=$(http POST http://localhost:3000/api/flashcards/generate \
  Content-Type:application/json \
  input_text="$(python3 -c "print('a' * 1000)")" | jq -r '.batch_id')

echo "Generated batch: $BATCH_ID"
```

## Example Test Workflow

```bash
# 1. Generate a batch and capture ID
BATCH_ID=$(http POST http://localhost:3000/api/flashcards/generate \
  Content-Type:application/json \
  input_text="$(python3 -c "print('a' * 1000)")" | jq -r '.batch_id')

# 2. Review the batch (mix of actions)
http POST http://localhost:3000/api/flashcards/batch/$BATCH_ID/review \
  Content-Type:application/json \
  decisions:='[
    {"index": 0, "action": "accept", "front_text": "Question 1", "back_text": "Answer 1 with enough characters"},
    {"index": 1, "action": "reject", "front_text": "Question 2", "back_text": "Answer 2 with enough characters"},
    {"index": 2, "action": "edit", "front_text": "Edited Question 3", "back_text": "Edited Answer 3 with details"}
  ]'

# 3. Try to review again (should fail with 409)
http POST http://localhost:3000/api/flashcards/batch/$BATCH_ID/review \
  Content-Type:application/json \
  decisions:='[{"index": 0, "action": "accept", "front_text": "Question 1", "back_text": "Answer 1 text"}]'
```

## Common Issues

### Issue: "Invalid batch ID format"
- **Solution**: Make sure you're using a valid UUID format
- **Check**: The batch ID should look like `c4ce0392-19df-4181-a16c-84884cbb3cad`

### Issue: "Batch already reviewed"
- **Solution**: Generate a new batch for each test that expects success
- **Note**: Each batch can only be reviewed once

### Issue: "Index out of bounds"
- **Solution**: The mock generator creates 3 cards (indices 0, 1, 2)
- **Check**: Make sure your indices are in range [0, 2]

### Issue: "Text must be at least 10 characters"
- **Solution**: Ensure both front_text and back_text have at least 10 characters
- **Tip**: Use descriptive text like "Sample flashcard question 1"

## Full Test Suite

For the complete test suite with all 19 test cases, see `review-tests.http` file.

You can run individual tests by copying them from the file to your terminal.

## Verification Checklist

- [ ] Generate endpoint works (returns batch_id)
- [ ] Review endpoint accepts valid decisions (201)
- [ ] Accept action creates flashcards
- [ ] Reject action doesn't create flashcards
- [ ] Edit action creates flashcards with was_edited=true
- [ ] Duplicate review returns 409 Conflict
- [ ] Invalid UUID returns 400
- [ ] Text length validation works
- [ ] Index validation works (duplicates, out of bounds)
- [ ] Non-existent batch returns 404
- [ ] Statistics are accurate in response
