Create a modern, responsive web-based level editor for a custom Stone-Paper-Scissors strategy game. The application should have a clean light theme with excellent UI/UX, inspired by professional game development tools. Use a soft white background, subtle shadows, rounded corners, pastel accent colors, smooth animations, and a well-organized layout.

The main area should contain a 10×10 interactive grid. Each cell must be clickable and capable of holding different types of content. Display row and column coordinates around the grid.

Add a left-side toolbar containing the following tools:

Place House 1
Place House 2
Place House 3
Place Stone
Place Paper
Place Scissor
Letter Tool
Eraser
Move 1
Move 2
Move 3
Select Tool

Only three houses may exist on the grid at any time.

When a house is selected, allow assigning one of the three objects: Stone, Paper, or Scissor.

The Letter Tool should allow the user to type a single character or short text into any grid cell. Display the text clearly inside the cell.

Implement a Select Tool that allows selecting a house or object already placed on the grid.

Movement rules:

Move 1 = move exactly 1 cell horizontally, vertically, or diagonally.
Move 2 = move exactly 2 cells horizontally, vertically, or diagonally.
Move 3 = move exactly 3 cells horizontally, vertically, or diagonally.

When a movable object is selected and a move tool is chosen, highlight all valid destination cells with a glowing indicator. Clicking a highlighted cell should perform the move.

Use visually distinct icons and colors:

Stone: gray rock icon
Paper: white document icon
Scissor: blue scissors icon
Houses: colored house icons with labels H1, H2, H3

Add a top toolbar with:

New Level
Save Level
Load Level
Export JSON
Import JSON
Undo
Redo
Clear Grid

Store the level internally as structured JSON and allow exporting/downloading the configuration.

Add a properties panel on the right showing:

Selected object
Cell coordinates
Object type
Assigned move value
Editable metadata

Provide drag-and-drop support in addition to click placement.

Include hover effects, smooth transitions, keyboard shortcuts, and responsive design.

The final result should feel like a polished indie-game level editor, intuitive for non-technical users, visually clean, and optimized for creating and testing Stone-Paper-Scissors game levels efficiently.