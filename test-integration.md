# Test Integration Guide

## Quick Test Steps

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Test Backend API
```bash
# Test all challenges
curl http://localhost:3000/api/defis/massifs

# Test period 1 challenges
curl http://localhost:3000/api/defis/periode/1

# Test bronze difficulty
curl http://localhost:3000/api/defis/difficulte/bronze
```

### 3. Start Frontend
```bash
cd ..
npm install
npm start
```

### 4. Test Frontend
- Navigate to the FrenchPhonicsGame component
- Should see loading state, then challenges loaded from backend
- Test drag and drop functionality
- Verify challenges are different from hardcoded ones

## Expected Results

### Backend API Response
```json
[
  {
    "id": "phoneme_a_1",
    "targetWord": "a",
    "difficulty": "bronze",
    "period": 1,
    "type": "assembly",
    "hint": "🔤 Assemble le son \"a\"",
    "successMessage": "✨ Parfait ! Tu maîtrises le son \"a\" !",
    "magicEffect": "phoneme_glow",
    "requiredAccuracy": 90,
    "components": [...],
    "dropZones": [...]
  }
]
```

### Frontend Behavior
- ✅ Loading state shows while fetching challenges
- ✅ Challenges load from backend API
- ✅ Drag and drop works with new challenge data
- ✅ Progress bar shows correct challenge count
- ✅ Navigation between challenges works

## Troubleshooting

### Backend Issues
- Check if backend is running on port 3000
- Verify TypeScript compilation
- Check console for import errors

### Frontend Issues
- Check browser console for API errors
- Verify CORS is configured correctly
- Check network tab for failed requests

### Integration Issues
- Verify import paths are correct
- Check that interfaces match between frontend and backend
- Ensure API endpoints are accessible

## Success Criteria
- [ ] Backend serves challenges via API
- [ ] Frontend loads challenges dynamically
- [ ] No hardcoded challenges in frontend
- [ ] All game functionality works with new data
- [ ] Error handling works for network issues 