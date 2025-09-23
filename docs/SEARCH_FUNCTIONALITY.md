# Global Search Functionality

## Overview
The SmartPrint system now includes a comprehensive global search feature that allows users to search across quotes, clients, and materials (suppliers) from anywhere in the application.

## Features

### 🔍 **Universal Search**
- Search across all major data types: Quotes, Clients, and Materials
- Real-time search results with debounced input
- Relevance-based result ranking
- Search history and suggestions

### ⌨️ **Keyboard Shortcuts**
- **Ctrl/Cmd + K**: Focus search bar (global shortcut)
- **/** (forward slash): Quick search focus
- **Arrow Keys**: Navigate through results
- **Enter**: Select highlighted result or perform search
- **Escape**: Close search results

### 📱 **User Experience**
- Responsive search interface
- Visual feedback during search
- Result categorization with icons
- Click outside to close
- Search analytics tracking

## How It Works

### Search Algorithm
The search uses a relevance scoring system:
- **Quote ID**: 10 points (highest priority)
- **Client Name**: 8 points
- **Contact Person**: 7 points
- **Product**: 6 points
- **Email**: 5 points
- **Status**: 3 points

### Data Sources
- **Quotes**: From `lib/dummy-data.ts` (QUOTE_DETAILS)
- **Clients**: From `constants/index.ts` (clients array)
- **Materials**: From `constants/index.ts` (materials array)

### Search Results
Each result includes:
- Type icon and color coding
- Title and subtitle
- Description with key details
- Direct navigation URL
- Relevance score

## Implementation Details

### Components
- `GlobalSearch.tsx`: Main search component
- `search-service.ts`: Search logic and data processing
- `AppHeader.tsx`: Header integration

### Search Service
- Singleton pattern for performance
- Configurable search options
- Type-safe interfaces
- Extensible architecture

### Performance Features
- Debounced search (300ms delay)
- Result limiting (default: 10 results)
- Efficient data filtering
- Local storage for history

## Usage Examples

### Basic Search
1. Click the search bar or press `Ctrl/Cmd + K`
2. Type your search query
3. Browse results by type
4. Click on a result to navigate

### Advanced Search
- Use specific terms: "Eagan", "Business Card", "Approved"
- Search by ID: "QT-2024-0718-001"
- Filter by type: Quotes, Clients, or Materials

### Search History
- Recent searches are automatically saved
- Click on history items to repeat searches
- History persists across browser sessions

## Technical Architecture

### Search Flow
1. User input → Debounced processing
2. Query validation → Search execution
3. Result processing → Relevance scoring
4. UI rendering → User interaction
5. Navigation → Result selection

### Data Flow
```
User Input → Search Service → Data Sources → Results Processing → UI Display
```

### State Management
- Local component state for UI
- Search service for data processing
- Local storage for persistence
- Router for navigation

## Future Enhancements

### Planned Features
- Advanced filters and sorting
- Search result pagination
- Saved searches and alerts
- Search analytics dashboard
- Full-text search capabilities

### Integration Opportunities
- API-based search for production
- Elasticsearch integration
- Real-time search updates
- Search result caching
- User preference learning

## Troubleshooting

### Common Issues
- **No results**: Check spelling and try different keywords
- **Slow search**: Ensure data sources are properly loaded
- **Navigation errors**: Verify URL routing configuration

### Debug Information
- Search analytics are logged to console
- Local storage contains search history
- Performance metrics available in browser dev tools

## Support

For technical support or feature requests related to the search functionality, please refer to the main project documentation or contact the development team.
