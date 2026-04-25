# Advanced AI-Powered Recommendation System

This feature provides dynamic problem recommendations based on user performance analysis using a sophisticated weakness calculation algorithm.

## API Endpoint

```
GET /api/advanced-recommendations/:userId
```

## Response Format

```json
{
  "status": "success",
  "data": {
    "recommended_topic": "linked_list",
    "weakness_score": 0.72,
    "reason": "Low success rate + Taking too long + Recent struggles",
    "problems": [
      {
        "id": "reverse-linked-list",
        "title": "Reverse Linked List",
        "difficulty": "easy",
        "topic": "linked_list"
      }
    ]
  }
}
```

## Weakness Calculation Algorithm

The system calculates weakness scores using multiple performance metrics:

### Input Data
- `user_progress` table with: user_id, problem_id, topic, difficulty, status, attempts_count, time_taken, created_at

### Metrics Calculated

1. **Accuracy Score**: `(attempted - solved) / attempted`
2. **Time Score**: `average(time_taken / expected_time[difficulty])`
3. **Attempts Score**: `average((attempts_count - 1) / 3)`
4. **Difficulty Weight**: Predefined weights (easy: 0.5, medium: 1.0, hard: 1.5)

### Final Formula
```
weakness = 0.4 × accuracy_score + 0.2 × time_score + 0.2 × attempts_score + 0.2 × difficulty_weight
```

### Difficulty Selection Logic
- weakness > 0.7 → **Easy** problems
- 0.4–0.7 → **Medium** problems
- < 0.4 → **Hard** problems

## Recommendation Flow

1. **Fetch User Progress**: Query user_progress table for the given user
2. **Calculate Topic Performance**: Group by topic and compute metrics
3. **Calculate Weakness Scores**: Apply formula to each topic
4. **Rank Topics**: Sort by weakness score (descending)
5. **Weighted Selection**: Use weakness scores as weights for random selection
6. **Filter Problems**: Get unsolved problems matching recommended difficulty
7. **Return Results**: 5-10 problems with explanation

## Key Features

- **Dynamic Difficulty**: Adjusts problem difficulty based on user weakness
- **Weighted Random Selection**: Higher weakness = higher selection probability
- **Recent Focus**: Prioritizes recently weak topics
- **Smart Filtering**: Excludes already solved problems
- **Detailed Reasoning**: Provides specific reasons for recommendations

## Usage Example

```bash
curl http://localhost:3000/api/advanced-recommendations/user123
```

## Error Handling

- Returns `null` if no user data available
- Falls back to mock data if database unavailable
- Gracefully handles missing or invalid data

## Database Schema Requirements

The system expects a `user_progress` table with:
- `user_id` (string)
- `problem_id` (string)
- `topic` (string or string array)
- `difficulty` ('easy' | 'medium' | 'hard')
- `status` ('solved' | 'attempted')
- `time_taken` (number, seconds)
- `created_at` (ISO timestamp)

## Future Enhancements

- Add attempts tracking to database schema
- Implement time-based decay for older performance data
- Add user skill level assessment
- Integrate with spaced repetition algorithms