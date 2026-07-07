/**
 * SPS LEVEL STUDIO - APPLICATION LOGIC
 * High-performance, object-oriented levels editor logic.
 */

class SPSLevelEditor {
  constructor() {
    // 1. Initial State
    this.gridWidth = 10;
    this.gridHeight = 10;
    this.gridData = {}; // Format: { "C3": { type: "stone", moveValue: 1, text: "", assignedObject: "none", metadata: {} } }
    
    this.activeTool = 'select'; // 'select', 'stone', 'paper', 'scissor', 'house1', 'house2', 'house3', 'letter', 'eraser', 'move1', 'move2', 'move3'
    this.multiSelectMode = false; // toggle for multi-select
    this.selectedTiles = new Set(); // store selected coordinates
    this.selectedCellCoord = null;
    this.clipboardData = null; // Copy-paste clipboard buffer
    
    // Undo / Redo History Stacks
    this.historyStack = [];
    this.redoStack = [];
    this.maxHistory = 50;

    // Movement highlights tracking
    this.activeMoveOrigin = null;
    this.validMoveTargets = [];

    // SVG Icons Map for Rendering Placed Items in Cells
    this.svgIcons = {
      stone: `<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2c-3.1 0-5.8 1.9-6.7 4.7C4.1 7.2 3 8.9 3 11c0 1.6.7 3 1.9 3.9C4.3 16 5 18 6.5 19.3c1.4.9 3.1 1.7 5.5 1.7 2.2 0 4.1-.7 5.5-1.7 1.4-1.3 2.1-3.3 1.6-4.4 1.2-.9 1.9-2.3 1.9-3.9 0-2.1-1.1-3.8-2.3-4.3-.9-2.8-3.6-4.7-6.7-4.7z"/>
              </svg>`,
      paper: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>`,
      scissor: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="6" cy="6" r="3"/>
                  <circle cx="6" cy="18" r="3"/>
                  <line x1="9.8" y1="8.2" x2="20" y2="17"/>
                  <line x1="17" y1="7" x2="8" y2="15.2"/>
                </svg>`,
      house: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>`
    };

    // 2. DOM Selectors
    this.dom = {
      grid: document.getElementById('editor-grid'),
      
      // Top actions
      btnNew: document.getElementById('btn-new'),
      btnClear: document.getElementById('btn-clear'),
      btnUndo: document.getElementById('btn-undo'),
      btnRedo: document.getElementById('btn-redo'),
      btnSave: document.getElementById('btn-save'),
      btnLoad: document.getElementById('btn-load'),
      btnExport: document.getElementById('btn-export'),
      btnImportTrigger: document.getElementById('btn-import-trigger'),
      fileImport: document.getElementById('file-import'),
      
      // Properties Active panel
      propsEmpty: document.getElementById('props-empty-state'),
      propsActive: document.getElementById('props-active-state'),
      propCoord: document.getElementById('prop-coord'),
      propType: document.getElementById('prop-type'),
      propHouseContainer: document.getElementById('prop-house-binding-container'),
      propHouseBinding: document.getElementById('prop-house-binding'),
      propLetterContainer: document.getElementById('prop-letter-text-container'),
      propLetterText: document.getElementById('prop-letter-text'),
      propMoveContainer: document.getElementById('prop-move-container'),
      propMoveVal: document.getElementById('prop-move-val'),
      propMeta: document.getElementById('prop-meta'),
      btnPropApply: document.getElementById('btn-prop-apply'),
      btnPropDelete: document.getElementById('btn-prop-delete'),
      
      // Global Level settings
      levelName: document.getElementById('level-name'),
      levelDifficulty: document.getElementById('level-difficulty'),
      levelDesc: document.getElementById('level-desc'),
      gridWidth: document.getElementById('grid-width'),
      gridHeight: document.getElementById('grid-height'),
      colHeaders: document.getElementById('col-headers'),
      rowHeaders: document.getElementById('row-headers')
    };

    // 3. Bootstrap Application
    this.init();
  }

  init() {
    this.generateGridDOM();
    this.setupEventListeners();
    this.saveHistoryState(); // Initial baseline undo point
    this.loadFromLocalStorage(true); // Load saved work if exists
  }

  // --- GRID SIZE HELPERS ---
  getColChar(index) {
    return String.fromCharCode(65 + index);
  }

  getColIndexFromCoord(coord) {
    const colChar = coord.match(/^[A-Z]+/)[0];
    return colChar.charCodeAt(0) - 65;
  }

  getRowFromCoord(coord) {
    const rowStr = coord.match(/\d+$/)[0];
    return parseInt(rowStr, 10);
  }

  // --- GRID CREATION ---
  generateGridDOM() {
    this.dom.grid.innerHTML = '';
    this.dom.colHeaders.innerHTML = '';
    this.dom.rowHeaders.innerHTML = '';

    // Generate column headers
    const corner = document.createElement('div');
    corner.className = 'corner-header';
    this.dom.colHeaders.appendChild(corner);

    for (let c = 0; c < this.gridWidth; c++) {
      const colHeader = document.createElement('div');
      colHeader.className = 'col-header';
      colHeader.textContent = this.getColChar(c);
      this.dom.colHeaders.appendChild(colHeader);
    }

    // Generate row headers
    for (let r = 1; r <= this.gridHeight; r++) {
      const rowHeader = document.createElement('div');
      rowHeader.className = 'row-header';
      rowHeader.textContent = r;
      this.dom.rowHeaders.appendChild(rowHeader);
    }

    // Set dynamic columns and rows layout styles
    this.dom.grid.style.gridTemplateColumns = `repeat(${this.gridWidth}, 60px)`;
    this.dom.grid.style.gridTemplateRows = `repeat(${this.gridHeight}, 60px)`;

    // Generate cells
    for (let r = 1; r <= this.gridHeight; r++) {
      for (let c = 0; c < this.gridWidth; c++) {
        const coord = `${this.getColChar(c)}${r}`;
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.setAttribute('data-coord', coord);
        cell.setAttribute('data-row', r);
        cell.setAttribute('data-col', c);
        
        // Setup Drag & Drop Handlers on Grid Cell
        this.setupCellDragAndDrop(cell);
        
        this.dom.grid.appendChild(cell);
      }
    }
  }

  handleGridResizeInput() {
    let newWidth = parseInt(this.dom.gridWidth.value, 10);
    let newHeight = parseInt(this.dom.gridHeight.value, 10);

    // Validate bounds
    if (isNaN(newWidth) || newWidth < 3) newWidth = 3;
    if (newWidth > 20) newWidth = 20;
    if (isNaN(newHeight) || newHeight < 3) newHeight = 3;
    if (newHeight > 20) newHeight = 20;

    // Apply sanitization to inputs
    this.dom.gridWidth.value = newWidth;
    this.dom.gridHeight.value = newHeight;

    if (newWidth === this.gridWidth && newHeight === this.gridHeight) {
      return; // No change
    }

    // Check if any placed objects will be cropped
    const outOfBoundsCells = [];
    Object.keys(this.gridData).forEach(coord => {
      const colIndex = this.getColIndexFromCoord(coord);
      const rowIndex = this.getRowFromCoord(coord);
      if (colIndex >= newWidth || rowIndex > newHeight) {
        outOfBoundsCells.push(coord);
      }
    });

    if (outOfBoundsCells.length > 0) {
      const confirmResize = confirm(
        `Shrinking the grid will delete ${outOfBoundsCells.length} placed object(s) outside the new boundaries (${outOfBoundsCells.join(', ')}). Do you want to proceed?`
      );
      if (!confirmResize) {
        // Revert inputs to current values
        this.dom.gridWidth.value = this.gridWidth;
        this.dom.gridHeight.value = this.gridHeight;
        return;
      }
    }

    // Apply resize
    this.saveHistoryState();

    // Delete out of bound items
    outOfBoundsCells.forEach(coord => {
      delete this.gridData[coord];
    });

    this.gridWidth = newWidth;
    this.gridHeight = newHeight;

    // Re-render layout
    this.generateGridDOM();
    
    // Rerender all remaining cells
    Object.keys(this.gridData).forEach(coord => {
      this.renderCell(coord);
    });

    // Check if selected cell coordinate is now out of bounds
    if (this.selectedCellCoord) {
      const selCol = this.getColIndexFromCoord(this.selectedCellCoord);
      const selRow = this.getRowFromCoord(this.selectedCellCoord);
      if (selCol >= this.gridWidth || selRow > this.gridHeight) {
        this.clearPropertiesPanel();
      } else {
        this.selectCell(this.selectedCellCoord);
      }
    }
  }

  // --- EVENT BINDINGS ---
  setupEventListeners() {
    // Tool Selection Bindings
    document.querySelectorAll('.btn-tool').forEach(btn => {
      // Multi-Select toggle button
      if (btn.id === 'multi-select-toggle') {
        btn.addEventListener('click', () => this.toggleMultiSelectMode());
        return;
      }
      btn.addEventListener('click', (e) => {
        const toolBtn = e.currentTarget;
        this.selectTool(toolBtn.getAttribute('data-tool'));
      });

      // HTML5 Drag Start Setup for Sidebar Tools
      btn.addEventListener('dragstart', (e) => {
        const tool = e.currentTarget.getAttribute('data-tool');
        e.dataTransfer.setData('text/plain', tool);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    // Paint / Drag Selection / Placement handlers
    this.isMouseDown = false;
    this.hasSavedHistoryForDrag = false;

    this.dom.grid.addEventListener('mousedown', (e) => {
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;
      this.isMouseDown = true;
      this.handleCellMouseDown(cell, e);
    });

    this.dom.grid.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;
      if (this.isMouseDown) {
        this.handleCellMouseDragOver(cell, e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // Grid Cell Click Actions
    this.dom.grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.grid-cell');
      if (!cell) return;
      this.handleCellClick(cell);
    });

    // Property Panel Controls
    this.dom.propType.addEventListener('change', () => this.handlePropertyTypeChange());
    this.dom.btnPropApply.addEventListener('click', () => this.applyPropertiesToCell());
    this.dom.btnPropDelete.addEventListener('click', () => this.deleteSelectedCellElement());

    // Top action bar actions
    this.dom.btnNew.addEventListener('click', () => this.actionNewLevel());
    this.dom.btnClear.addEventListener('click', () => this.actionClearGrid());
    this.dom.btnUndo.addEventListener('click', () => this.actionUndo());
    this.dom.btnRedo.addEventListener('click', () => this.actionRedo());
    this.dom.btnSave.addEventListener('click', () => this.actionSaveDraft());
    this.dom.btnLoad.addEventListener('click', () => this.actionLoadDraft());
    this.dom.btnExport.addEventListener('click', () => this.actionExportJSON());
    
    // Grid size input event listeners
    this.dom.gridWidth.addEventListener('change', () => this.handleGridResizeInput());
    this.dom.gridHeight.addEventListener('change', () => this.handleGridResizeInput());

    // JSON file Import trigger setup
    this.dom.btnImportTrigger.addEventListener('click', () => this.dom.fileImport.click());
    this.dom.fileImport.addEventListener('change', (e) => this.handleFileImport(e));

    // Global Key Listener for shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
      // Shortcut for Multi-Select toggle
      if (e.key.toLowerCase() === 'm') {
        const activeEl = document.activeElement;
        if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT') {
          return;
        }
        this.toggleMultiSelectMode();
      }
    });
  }

  // --- TOOLBAR ENGINE ---
  selectTool(toolName) {
    // Clear active movement highlights if choosing any other tool
    if (!toolName.startsWith('move')) {
      this.clearMovementHighlights();
    }

    this.activeTool = toolName;
    
    // Update visual active classes
    document.querySelectorAll('.btn-tool').forEach(btn => {
      if (btn.getAttribute('data-tool') === toolName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Apply tool to multiple selected tiles immediately if any selected
    if (this.selectedTiles.size > 0 && toolName !== 'select' && !toolName.startsWith('move')) {
      this.saveHistoryState();
      for (let coord of this.selectedTiles) {
        if (toolName === 'eraser') {
          delete this.gridData[coord];
          this.renderCell(coord);
          if (this.selectedCellCoord === coord) {
            this.clearPropertiesPanel();
          }
        } else {
          // Check houses limit
          if (toolName.startsWith('house')) {
            const check = this.validateHouseLimit(toolName, coord);
            if (!check) continue;
          }
          let defaultMove = 0;
          if (['stone', 'paper', 'scissor'].includes(toolName)) {
            defaultMove = 1;
          }
          this.gridData[coord] = {
            type: toolName,
            moveValue: defaultMove,
            assignedObject: 'none',
            text: '',
            metadata: {}
          };
          this.renderCell(coord);
        }
      }
      
      // If it is the letter tool, start inline edit on the first cell in selection
      if (toolName === 'letter') {
        const firstCoord = this.selectedTiles.values().next().value;
        this.selectCell(firstCoord);
        this.startInlineEdit(firstCoord);
      } else {
        this.clearPropertiesPanel();
      }
      this.clearSelection();
      return;
    }

    // Contextual behavior if Select tool is chosen
    if (toolName === 'select' && this.selectedCellCoord) {
      this.selectCell(this.selectedCellCoord);
    } else if (toolName === 'letter' && this.selectedCellCoord) {
      const coord = this.selectedCellCoord;
      if (!this.gridData[coord] || this.gridData[coord].type !== 'letter') {
        this.saveHistoryState();
        this.gridData[coord] = {
          type: 'letter',
          moveValue: 0,
          assignedObject: 'none',
          text: '',
          metadata: {}
        };
        this.renderCell(coord);
      }
      this.startInlineEdit(coord);
    } else if (toolName.startsWith('move')) {
      // If choosing a move physics modifier, verify a selected item exists
      if (this.selectedCellCoord && this.gridData[this.selectedCellCoord]) {
        const item = this.gridData[this.selectedCellCoord];
        if (['stone', 'paper', 'scissor'].includes(item.type) || item.type.startsWith('house')) {
          this.calculateAndShowMovement(this.selectedCellCoord, toolName);
        } else {
          alert('Select a movable object (Stone, Paper, Scissors or House) first to apply movements.');
          this.selectTool('select');
        }
      } else {
        alert('Select an object on the grid first before choosing a Move modifier.');
        this.selectTool('select');
      }
    }
  }

  toggleMultiSelectMode() {
    this.multiSelectMode = !this.multiSelectMode;
    const btn = document.getElementById('multi-select-toggle');
    if (btn) {
      if (this.multiSelectMode) {
        btn.classList.add('active');
        // Unselect active tool if it's select to show active state on toggle
        this.selectTool('select');
      } else {
        btn.classList.remove('active');
        this.clearSelection();
      }
    }
  }

  handleCellMouseDown(cell, e) {
    const coord = cell.getAttribute('data-coord');
    this.hasSavedHistoryForDrag = false;

    if (this.multiSelectMode || e.shiftKey) {
      if (this.selectedTiles.has(coord)) {
        this.selectedTiles.delete(coord);
        cell.classList.remove('selected');
      } else {
        this.selectedTiles.add(coord);
        cell.classList.add('selected');
      }
      return;
    }

    // Normal placement drag start
    if (['stone', 'paper', 'scissor', 'eraser'].includes(this.activeTool)) {
      if (this.activeTool === 'eraser') {
        this.deleteCellElementDrag(coord);
      } else {
        this.placeElementDrag(coord, this.activeTool);
      }
    }
  }

  handleCellMouseDragOver(cell, e) {
    const coord = cell.getAttribute('data-coord');

    if (this.multiSelectMode || e.shiftKey) {
      if (!this.selectedTiles.has(coord)) {
        this.selectedTiles.add(coord);
        cell.classList.add('selected');
      }
      return;
    }

    if (['stone', 'paper', 'scissor', 'eraser'].includes(this.activeTool)) {
      if (this.activeTool === 'eraser') {
        this.deleteCellElementDrag(coord);
      } else {
        this.placeElementDrag(coord, this.activeTool);
      }
    }
  }

  placeElementDrag(coord, toolType) {
    if (!this.hasSavedHistoryForDrag) {
      this.saveHistoryState();
      this.hasSavedHistoryForDrag = true;
    }

    let defaultMove = 0;
    if (['stone', 'paper', 'scissor'].includes(toolType)) {
      defaultMove = 1;
    }

    this.gridData[coord] = {
      type: toolType,
      moveValue: defaultMove,
      assignedObject: 'none',
      text: '',
      metadata: {}
    };

    this.renderCell(coord);
  }

  deleteCellElementDrag(coord) {
    if (!this.gridData[coord]) return;

    if (!this.hasSavedHistoryForDrag) {
      this.saveHistoryState();
      this.hasSavedHistoryForDrag = true;
    }

    delete this.gridData[coord];
    this.renderCell(coord);

    if (this.selectedCellCoord === coord) {
      this.clearPropertiesPanel();
    }
  }

  // --- DYNAMIC INTERACTION: CELL CLICK HANDLER ---
  handleCellClick(cell) {
    // If the cell contains an active inline input, let the input keep focus and ignore the click
    if (cell.querySelector('.inline-cell-input')) {
      return;
    }

    const coord = cell.getAttribute('data-coord');
    
    // If movement execution is active and clicked cell is a valid destination highlight
    if (this.activeTool.startsWith('move') && cell.classList.contains('valid-move-target')) {
      this.executeMovement(this.activeMoveOrigin, coord);
      return;
    }

    // In multi-select mode (or shift clicked), handle click toggle selection
    if (this.multiSelectMode) {
      if (this.selectedTiles.has(coord)) {
        this.selectedTiles.delete(coord);
        cell.classList.remove('selected');
      } else {
        this.selectedTiles.add(coord);
        cell.classList.add('selected');
      }
      return;
    }

    // Process toolbar tool placing actions
    if (this.activeTool === 'select') {
      this.selectCell(coord);
    } else if (this.activeTool === 'eraser') {
      this.deleteCellElement(coord);
    } else if (['stone', 'paper', 'scissor', 'house1', 'house2', 'house3', 'letter'].includes(this.activeTool)) {
      this.placeElement(coord, this.activeTool);
    }
  }

  // --- PLACEMENT CONTROLS ---
  placeElement(coord, toolType) {
    // If it's already a letter cell and we are selecting the letter tool, do not overwrite or save state, just start inline edit.
    if (toolType === 'letter' && this.gridData[coord] && this.gridData[coord].type === 'letter') {
      this.selectCell(coord);
      this.startInlineEdit(coord);
      return;
    }

    this.saveHistoryState(); // Store history before modification

    // Enforce 3-House constraint validation rules
    if (toolType.startsWith('house')) {
      const houseLimitCheck = this.validateHouseLimit(toolType, coord);
      if (!houseLimitCheck) {
        return; // Reject placement
      }
    }

    // Default configuration variables
    let defaultMove = 0;
    if (['stone', 'paper', 'scissor'].includes(toolType)) {
      defaultMove = 1; // Movable objects default range
    }

    this.gridData[coord] = {
      type: toolType,
      moveValue: defaultMove,
      assignedObject: 'none',
      text: '',
      metadata: {}
    };

    this.renderCell(coord);
    this.selectCell(coord); // Auto-select placed item to reveal settings

    // Open inline text editor ONLY when using the text (Letter) tool
    if (toolType === 'letter') {
      this.startInlineEdit(coord);
    }
  }

  deleteCellElement(coord) {
    if (!this.gridData[coord]) return;
    
    this.saveHistoryState();
    delete this.gridData[coord];
    
    this.renderCell(coord);
    
    if (this.selectedCellCoord === coord) {
      this.clearPropertiesPanel();
    }
  }

  // --- MOVEMENT CALCULATOR ENGINE ---
  calculateAndShowMovement(originCoord, moveToolName) {
    this.clearMovementHighlights();
    
    this.activeMoveOrigin = originCoord;
    const originCell = document.querySelector(`.grid-cell[data-coord="${originCoord}"]`);
    if (!originCell) return;

    const startRow = parseInt(originCell.getAttribute('data-row'));
    const startCol = parseInt(originCell.getAttribute('data-col'));
    
    // Parse step value (Move 1, Move 2, or Move 3)
    const step = parseInt(moveToolName.replace('move', ''));
    
    // Directions offsets: Horizontal, Vertical, Diagonal directions
    const offsets = [
      { r: 0, c: step },   // Right
      { r: 0, c: -step },  // Left
      { r: step, c: 0 },   // Down
      { r: -step, c: 0 },  // Up
      { r: step, c: step },   // Down-Right
      { r: step, c: -step },  // Down-Left
      { r: -step, c: step },  // Up-Right
      { r: -step, c: -step }  // Up-Left
    ];

    offsets.forEach(offset => {
      const targetRow = startRow + offset.r;
      const targetCol = startCol + offset.c;

      // Bounds validation
      if (targetRow >= 1 && targetRow <= this.gridHeight && targetCol >= 0 && targetCol < this.gridWidth) {
        const targetCoord = `${this.getColChar(targetCol)}${targetRow}`;
        
        // Highlight destination in UI
        const targetCell = document.querySelector(`.grid-cell[data-coord="${targetCoord}"]`);
        if (targetCell) {
          targetCell.classList.add('valid-move-target');
          this.validMoveTargets.push(targetCoord);
        }
      }
    });
  }

  executeMovement(fromCoord, toCoord) {
    if (!fromCoord || !toCoord) return;
    
    this.saveHistoryState();
    
    // Transfer data structure to new cell
    this.gridData[toCoord] = JSON.parse(JSON.stringify(this.gridData[fromCoord]));
    delete this.gridData[fromCoord];

    // Rerender cells
    this.renderCell(fromCoord);
    this.renderCell(toCoord);

    // Reset editor tools
    this.clearMovementHighlights();
    this.selectTool('select');
    this.selectCell(toCoord);
  }

  clearMovementHighlights() {
    this.validMoveTargets.forEach(coord => {
      const cell = document.querySelector(`.grid-cell[data-coord="${coord}"]`);
      if (cell) cell.classList.remove('valid-move-target');
    });
    this.validMoveTargets = [];
    this.activeMoveOrigin = null;
  }

  // --- HOUSES CONSTRAINT RULE VALIDATION ---
  validateHouseLimit(houseType, placingCoord) {
    // Locate if the same house already exists elsewhere
    let existingCoord = null;
    Object.keys(this.gridData).forEach(coord => {
      if (this.gridData[coord].type === houseType) {
        existingCoord = coord;
      }
    });

    if (existingCoord && existingCoord !== placingCoord) {
      // Prompt user to relocate house
      const confirmRelocate = confirm(`${houseType.toUpperCase().replace('HOUSE', 'House ')} already exists on the grid at ${existingCoord}. Do you want to move it to ${placingCoord}?`);
      if (confirmRelocate) {
        // Erase old one, place new one
        delete this.gridData[existingCoord];
        this.renderCell(existingCoord);
        return true;
      } else {
        return false; // Cancel placement
      }
    }

    // Limit 3 Houses check
    const houseCount = Object.values(this.gridData).filter(item => item.type.startsWith('house')).length;
    // Account for overwriting existing house in place
    const placingOnExistingHouse = this.gridData[placingCoord] && this.gridData[placingCoord].type.startsWith('house');

    if (houseCount >= 3 && !placingOnExistingHouse && !existingCoord) {
      alert('Only three houses (H1, H2, H3) may exist on the grid at any time. Remove or relocate an existing house first.');
      return false;
    }

    return true;
  }

  // --- DRAG AND DROP CAPABILITIES ---
  setupCellDragAndDrop(cell) {
    // Hover highlight states
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      cell.classList.add('drag-over');
    });

    cell.addEventListener('dragleave', () => {
      cell.classList.remove('drag-over');
    });

    // Drop trigger handler
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      
      const toolType = e.dataTransfer.getData('text/plain');
      const coord = cell.getAttribute('data-coord');
      
      if (['stone', 'paper', 'scissor', 'house1', 'house2', 'house3', 'letter'].includes(toolType)) {
        this.placeElement(coord, toolType);
      }
    });
  }

  // --- STATE HISTORY MECHANICS (UNDO/REDO) ---
  saveHistoryState() {
    // Clear redo timeline whenever a new fresh action occurs
    this.redoStack = [];
    this.dom.btnRedo.disabled = true;

    // Snapshot state representation
    const stateSnapshot = {
      gridData: JSON.parse(JSON.stringify(this.gridData)),
      levelName: this.dom.levelName.value,
      difficulty: this.dom.levelDifficulty.value,
      description: this.dom.levelDesc.value,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight
    };

    this.historyStack.push(stateSnapshot);

    // Limit stack capacity
    if (this.historyStack.length > this.maxHistory) {
      this.historyStack.shift();
    }

    // Enable undo visual triggers
    if (this.historyStack.length > 1) {
      this.dom.btnUndo.disabled = false;
    }
  }

  actionUndo() {
    if (this.historyStack.length <= 1) return;

    // Move current state to redo timeline
    const currentState = {
      gridData: JSON.parse(JSON.stringify(this.gridData)),
      levelName: this.dom.levelName.value,
      difficulty: this.dom.levelDifficulty.value,
      description: this.dom.levelDesc.value
    };
    this.redoStack.push(currentState);
    this.dom.btnRedo.disabled = false;

    // Pop and apply previous history point
    this.historyStack.pop(); // Pop current
    const previousState = this.historyStack[this.historyStack.length - 1];
    
    this.applyStateSnapshot(previousState);

    if (this.historyStack.length <= 1) {
      this.dom.btnUndo.disabled = true;
    }
  }

  actionRedo() {
    if (this.redoStack.length === 0) return;

    const nextState = this.redoStack.pop();
    
    // Save current to history timeline
    const currentState = {
      gridData: JSON.parse(JSON.stringify(this.gridData)),
      levelName: this.dom.levelName.value,
      difficulty: this.dom.levelDifficulty.value,
      description: this.dom.levelDesc.value
    };
    this.historyStack.push(currentState);
    this.dom.btnUndo.disabled = false;

    this.applyStateSnapshot(nextState);

    if (this.redoStack.length === 0) {
      this.dom.btnRedo.disabled = true;
    }
  }

  applyStateSnapshot(stateSnapshot) {
    this.gridData = JSON.parse(JSON.stringify(stateSnapshot.gridData));
    
    this.dom.levelName.value = stateSnapshot.levelName;
    this.dom.levelDifficulty.value = stateSnapshot.difficulty;
    this.dom.levelDesc.value = stateSnapshot.description;

    this.gridWidth = stateSnapshot.gridWidth || 10;
    this.gridHeight = stateSnapshot.gridHeight || 10;
    this.dom.gridWidth.value = this.gridWidth;
    this.dom.gridHeight.value = this.gridHeight;

    // Regenerate layout structure
    this.generateGridDOM();

    // Refresh complete grid canvas rendering
    Object.keys(this.gridData).forEach(coord => {
      this.renderCell(coord);
    });

    // Refresh active dynamic selection property panels
    if (this.selectedCellCoord) {
      const selCol = this.getColIndexFromCoord(this.selectedCellCoord);
      const selRow = this.getRowFromCoord(this.selectedCellCoord);
      if (selCol >= this.gridWidth || selRow > this.gridHeight) {
        this.clearPropertiesPanel();
      } else {
        this.selectCell(this.selectedCellCoord);
      }
    }
  }

  // --- GRAPHICAL UI CELL RENDERING ---
  renderCell(coord) {
    const cell = document.querySelector(`.grid-cell[data-coord="${coord}"]`);
    if (!cell) return;

    cell.innerHTML = '';
    const item = this.gridData[coord];

    if (!item) return;

    // Placed Wrapper Setup
    const container = document.createElement('div');
    container.className = `placed-object obj-${item.type}`;

    if (['stone', 'paper', 'scissor'].includes(item.type)) {
      container.innerHTML = this.svgIcons[item.type];
      
      // Render Physics Move value ranges
      if (item.moveValue > 0) {
        const moveBadge = document.createElement('div');
        moveBadge.className = 'move-range-indicator';
        moveBadge.textContent = item.moveValue;
        cell.appendChild(moveBadge);
      }
    } else if (item.type.startsWith('house')) {
      container.innerHTML = this.svgIcons.house;
      
      // House text markers labels (H1, H2, H3)
      const label = document.createElement('div');
      label.className = 'house-label';
      label.textContent = item.type.toUpperCase().replace('HOUSE', 'H');
      container.appendChild(label);

      // House sub-object binding indicator
      if (item.assignedObject && item.assignedObject !== 'none') {
        const dot = document.createElement('div');
        dot.className = `house-binding-dot bind-${item.assignedObject}`;
        container.appendChild(dot);
      }
    } else if (item.type === 'letter') {
      container.textContent = item.text || 'A';
    }

    cell.appendChild(container);
  }

  // --- PROPERTIES EDITOR PANEL CONTROLLERS ---
  selectCell(coord) {
    // Clear previous cell selection outlines
    document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('selected'));
    
    // Preserve multi-select state if active
    if (this.multiSelectMode) {
      this.selectedTiles.add(coord);
      const cell = document.querySelector(`.grid-cell[data-coord="${coord}"]`);
      if (cell) cell.classList.add('selected');
    } else {
      this.selectedCellCoord = coord;
      const cell = document.querySelector(`.grid-cell[data-coord="${coord}"]`);
      if (cell) cell.classList.add('selected');
    }

    const item = this.gridData[coord];

    // Toggle forms empty / active settings states
    this.dom.propsEmpty.style.display = 'none';
    this.dom.propsActive.style.display = 'block';
    
    this.dom.propCoord.textContent = coord;

    if (!item) {
      // Empty grid cell defaults
      this.dom.propType.value = 'none';
      this.dom.propHouseContainer.style.display = 'none';
      this.dom.propLetterContainer.style.display = 'none';
      this.dom.propMoveContainer.style.display = 'block';
      this.dom.propMoveVal.value = '0';
      this.dom.propMeta.value = '';
      return;
    }

    // Populating details values
    this.dom.propType.value = item.type;
    this.dom.propMoveVal.value = item.moveValue || '0';
    this.dom.propMeta.value = Object.keys(item.metadata).length > 0 ? JSON.stringify(item.metadata) : '';

    // Contextual form controls rendering
    if (item.type.startsWith('house')) {
      this.dom.propHouseContainer.style.display = 'block';
      this.dom.propHouseBinding.value = item.assignedObject || 'none';
      
      this.dom.propLetterContainer.style.display = 'none';
      this.dom.propMoveContainer.style.display = 'block';
    } else if (item.type === 'letter') {
      this.dom.propLetterContainer.style.display = 'block';
      this.dom.propLetterText.value = item.text || 'A';
      
      this.dom.propHouseContainer.style.display = 'none';
      this.dom.propMoveContainer.style.display = 'none';
    } else {
      // Basic objects (Stone, Paper, Scissor)
      this.dom.propHouseContainer.style.display = 'none';
      this.dom.propLetterContainer.style.display = 'none';
      this.dom.propMoveContainer.style.display = 'block';
    }
  }

  clearPropertiesPanel() {
    this.selectedCellCoord = null;
    document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('selected'));
    this.clearSelection();
    
    this.dom.propsActive.style.display = 'none';
    this.dom.propsEmpty.style.display = 'flex';
  }

  clearSelection() {
    this.selectedTiles.forEach(coord => {
      const cell = document.querySelector(`.grid-cell[data-coord="${coord}"]`);
      if (cell) cell.classList.remove('selected');
    });
    this.selectedTiles.clear();
  }

  handlePropertyTypeChange() {
    const selectedType = this.dom.propType.value;
    
    // Toggle properties forms visibility values immediately before applying
    if (selectedType.startsWith('house')) {
      this.dom.propHouseContainer.style.display = 'block';
      this.dom.propLetterContainer.style.display = 'none';
      this.dom.propMoveContainer.style.display = 'block';
    } else if (selectedType === 'letter') {
      this.dom.propLetterContainer.style.display = 'block';
      this.dom.propHouseContainer.style.display = 'none';
      this.dom.propMoveContainer.style.display = 'none';
    } else {
      this.dom.propHouseContainer.style.display = 'none';
      this.dom.propLetterContainer.style.display = 'none';
      this.dom.propMoveContainer.style.display = 'block';
    }
  }

  applyPropertiesToCell() {
    const coord = this.selectedCellCoord;
    if (!coord) return;

    const newType = this.dom.propType.value;
    this.saveHistoryState();

    if (newType === 'none') {
      delete this.gridData[coord];
      this.renderCell(coord);
      this.clearPropertiesPanel();
      return;
    }

    // House limit check on settings change
    if (newType.startsWith('house')) {
      const check = this.validateHouseLimit(newType, coord);
      if (!check) return;
    }

    // Safe structure build
    let metadataParsed = {};
    try {
      if (this.dom.propMeta.value.trim()) {
        metadataParsed = JSON.parse(this.dom.propMeta.value);
      }
    } catch (err) {
      alert('Invalid JSON entered in metadata field.');
      return;
    }

    this.gridData[coord] = {
      type: newType,
      moveValue: parseInt(this.dom.propMoveVal.value) || 0,
      assignedObject: newType.startsWith('house') ? this.dom.propHouseBinding.value : 'none',
      text: newType === 'letter' ? this.dom.propLetterText.value : '',
      metadata: metadataParsed
    };

    this.renderCell(coord);
    this.selectCell(coord); // Redraw options
  }

  deleteSelectedCellElement() {
    if (this.selectedCellCoord) {
      this.deleteCellElement(this.selectedCellCoord);
    }
  }

  // --- ACTIONS: TOP BAR CONTROLLERS ---
  actionNewLevel() {
    const confirmNew = confirm('Start a fresh new level design? Any unsaved edits will be cleared.');
    if (!confirmNew) return;

    this.saveHistoryState();
    
    this.gridData = {};
    this.dom.levelName.value = 'My Epic Level';
    this.dom.levelDifficulty.value = 'Medium';
    this.dom.levelDesc.value = '';

    this.gridWidth = 10;
    this.gridHeight = 10;
    this.dom.gridWidth.value = 10;
    this.dom.gridHeight.value = 10;

    // Regenerate layout structure
    this.generateGridDOM();

    this.clearPropertiesPanel();
    this.selectTool('select');
  }

  actionClearGrid() {
    const confirmClear = confirm('Erase all element placements on the grid canvas? Level metadata will be preserved.');
    if (!confirmClear) return;

    this.saveHistoryState();
    this.gridData = {};

    // Regenerate empty layout
    this.generateGridDOM();

    this.clearPropertiesPanel();
  }

  actionSaveDraft() {
    const payloadSnapshot = {
      levelName: this.dom.levelName.value,
      difficulty: this.dom.levelDifficulty.value,
      description: this.dom.levelDesc.value,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      grid: this.gridData
    };

    localStorage.setItem('sps_level_draft', JSON.stringify(payloadSnapshot));
    
    // User feedback animation/alert
    const saveBtn = this.dom.btnSave;
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>Saved!</span>
    `;
    saveBtn.style.backgroundColor = '#10b981';
    saveBtn.style.borderColor = '#10b981';

    setTimeout(() => {
      saveBtn.innerHTML = originalText;
      saveBtn.style.backgroundColor = '';
      saveBtn.style.borderColor = '';
    }, 1500);
  }

  actionLoadDraft() {
    this.loadFromLocalStorage(false);
  }

  loadFromLocalStorage(initialBoot = false) {
    const saved = localStorage.getItem('sps_level_draft');
    if (!saved) {
      if (!initialBoot) alert('No saved level drafts found in local storage.');
      return;
    }

    try {
      const data = JSON.parse(saved);
      
      this.saveHistoryState();
      
      this.dom.levelName.value = data.levelName || 'My Epic Level';
      this.dom.levelDifficulty.value = data.difficulty || 'Medium';
      this.dom.levelDesc.value = data.description || '';
      
      this.gridWidth = data.gridWidth || 10;
      this.gridHeight = data.gridHeight || 10;
      this.dom.gridWidth.value = this.gridWidth;
      this.dom.gridHeight.value = this.gridHeight;

      this.gridData = data.grid || {};

      // Regenerate layout structure
      this.generateGridDOM();

      // Draw all elements on Canvas
      Object.keys(this.gridData).forEach(coord => {
        this.renderCell(coord);
      });

      this.clearPropertiesPanel();
      
      if (!initialBoot) {
        alert('Level draft restored successfully!');
      }
    } catch (err) {
      if (!initialBoot) alert('Error parsing draft data configuration.');
    }
  }

  // --- ACTIONS: CONFIG EXPORT & IMPORT ---
  actionExportJSON() {
    const payload = {
      levelName: this.dom.levelName.value,
      difficulty: this.dom.levelDifficulty.value,
      description: this.dom.levelDesc.value,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      grid: this.gridData
    };

    const dataString = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    
    // Auto download link trigger
    const link = document.createElement('a');
    const filename = `${this.dom.levelName.value.toLowerCase().replace(/\s+/g, '_')}_level.json`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        this.saveHistoryState();

        this.dom.levelName.value = data.levelName || 'Imported Level';
        this.dom.levelDifficulty.value = data.difficulty || 'Medium';
        this.dom.levelDesc.value = data.description || '';
        
        this.gridWidth = data.gridWidth || 10;
        this.gridHeight = data.gridHeight || 10;
        this.dom.gridWidth.value = this.gridWidth;
        this.dom.gridHeight.value = this.gridHeight;

        this.gridData = data.grid || {};

        // Regenerate layout structure
        this.generateGridDOM();

        // Render Canvas
        Object.keys(this.gridData).forEach(coord => {
          this.renderCell(coord);
        });

        this.clearPropertiesPanel();
        this.selectTool('select');

        alert('Level JSON configuration imported successfully!');
      } catch (err) {
        alert('Error: Invalid JSON schema format.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input value
    this.dom.fileImport.value = '';
  }

  // --- KEYBOARD SHORTCUT ENGINE ---
  handleKeyboardShortcuts(event) {
    // Avoid triggering shortcuts inside form inputs
    const activeEl = document.activeElement;
    if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT') {
      return;
    }

    const key = event.key.toLowerCase();
    
    // Ctrl combo keys
    if (event.ctrlKey) {
      if (key === 'z') {
        event.preventDefault();
        this.actionUndo();
      } else if (key === 'y') {
        event.preventDefault();
        this.actionRedo();
      } else if (key === 'c') {
        // Copy Selected Element Configuration
        if (this.selectedCellCoord && this.gridData[this.selectedCellCoord]) {
          event.preventDefault();
          this.clipboardData = JSON.parse(JSON.stringify(this.gridData[this.selectedCellCoord]));
          // Visual copy flash feedback
          const selectedCell = document.querySelector(`.grid-cell.selected`);
          if (selectedCell) {
            selectedCell.style.transition = 'none';
            selectedCell.style.opacity = '0.5';
            setTimeout(() => {
              selectedCell.style.transition = '';
              selectedCell.style.opacity = '';
            }, 120);
          }
        }
      } else if (key === 'v') {
        // Paste Copied Element
        if (this.selectedCellCoord && this.clipboardData) {
          event.preventDefault();
          this.saveHistoryState();
          
          if (this.clipboardData.type.startsWith('house')) {
            const check = this.validateHouseLimit(this.clipboardData.type, this.selectedCellCoord);
            if (!check) return;
          }

          this.gridData[this.selectedCellCoord] = JSON.parse(JSON.stringify(this.clipboardData));
          this.renderCell(this.selectedCellCoord);
          this.selectCell(this.selectedCellCoord);
        }
      }
      return;
    }

    // Standard hotkeys
    switch (key) {
      case 's':
        this.selectTool('select');
        break;
      case 'e':
      case 'delete':
      case 'backspace':
        this.selectTool('eraser');
        break;
      case 't':
        this.selectTool('letter');
        break;
      case 'r':
        this.selectTool('stone');
        break;
      case 'p':
        this.selectTool('paper');
        break;
      case 'c':
        this.selectTool('scissor');
        break;
      case '1':
        this.selectTool('house1');
        break;
      case '2':
        this.selectTool('house2');
        break;
      case '3':
        this.selectTool('house3');
        break;
      case 'escape':
        this.selectTool('select');
        this.clearPropertiesPanel();
        break;
    }
  }

  // --- DIRECT IN-CELL TYPING & INLINE EDITING LOGIC ---
  startInlineEdit(coord, clearAndAppend = false) {
    const cell = document.querySelector(`.grid-cell[data-coord="${coord}"]`);
    if (!cell) return;

    const item = this.gridData[coord];
    if (!item || item.type !== 'letter') return;

    let placedObj = cell.querySelector('.placed-object');
    if (!placedObj) {
      this.renderCell(coord);
      placedObj = cell.querySelector('.placed-object');
    }

    placedObj.innerHTML = '';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-cell-input';
    input.maxLength = 8;
    input.setAttribute('autocomplete', 'off');
    input.value = clearAndAppend ? item.text : (item.text || '');
    
    placedObj.appendChild(input);
    input.focus();
    
    if (clearAndAppend) {
      // Put cursor at the end of text
      input.setSelectionRange(input.value.length, input.value.length);
    } else {
      input.select();
    }

    let committed = false;

    const commit = () => {
      if (committed) return;
      committed = true;
      this.commitInlineEdit(coord, input.value);
    };

    const cancel = () => {
      if (committed) return;
      committed = true;
      this.cancelInlineEdit(coord);
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });
  }

  commitInlineEdit(coord, newValue) {
    if (this.gridData[coord] && this.gridData[coord].type === 'letter') {
      const oldText = this.gridData[coord].text || '';
      const trimmedNewValue = newValue.trim();
      if (oldText !== trimmedNewValue) {
        this.saveHistoryState();
        this.gridData[coord].text = trimmedNewValue;
      }
      this.renderCell(coord);
      this.selectCell(coord);
    }
  }

  cancelInlineEdit(coord) {
    this.renderCell(coord);
    this.selectCell(coord);
  }
}

// Instantiate App on Page Load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SPSLevelEditor();
});
