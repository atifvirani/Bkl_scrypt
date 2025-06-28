document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const editor = document.getElementById('editor');
    const output = document.getElementById('output');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const exampleCards = document.querySelectorAll('.example-card');
    
    // Initialize output
    output.textContent = "Output will appear here...";

    // Example programs data
    const examples = {
        hello: `chalu_kar\nbol_bkl("Hello World!")\nbuss_ho_gaya`,
        variables: `chalu_kar\nnaam = "BKL"\nbol_bkl("Hello " + naam)\nbuss_ho_gaya`,
        loops: `chalu_kar\nye_baar_baar_kar (i = 1; i <= 3; i = i + 1)\n    bol_bkl("Count: " + i)\nbuss_ho_gaya`,
        conditions: `chalu_kar\numar = 20\nagar_ye (umar >= 18)\n    bol_bkl("Adult")\nwarna\n    bol_bkl("Child")\nbuss_ho_gaya`
    };

    // Load example when clicked
    exampleCards.forEach(card => {
        card.addEventListener('click', function() {
            const example = this.getAttribute('data-example');
            editor.value = examples[example];
            output.textContent = `Loaded example: ${this.querySelector('h3').textContent}`;
        });
    });

    // Run button click handler
    runBtn.addEventListener('click', function() {
        try {
            executeBKL(editor.value);
        } catch (error) {
            output.innerHTML = `<span style="color: #ef4444">${error.message}</span>`;
        }
    });

    // Clear button click handler
    clearBtn.addEventListener('click', function() {
        output.textContent = "";
    });

    // BKL Script interpreter
    function executeBKL(code) {
        // Reset output
        output.textContent = "";
        
        // Check for start and end markers
        if (!code.includes('chalu_kar') || !code.includes('buss_ho_gaya')) {
            throw new Error("Bosdk! Code must start with 'chalu_kar' and end with 'buss_ho_gaya'");
        }
        
        // Extract the code between markers
        const codeLines = code.split('\n');
        const startIndex = codeLines.findIndex(line => line.trim() === 'chalu_kar');
        const endIndex = codeLines.findIndex(line => line.trim() === 'buss_ho_gaya');
        
        if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
            throw new Error("Bosdk! Invalid code structure");
        }
        
        const executableCode = codeLines.slice(startIndex + 1, endIndex);
        
        // Create execution environment
        const env = {
            constants: {},
            variables: {},
            bol_bkl: function(text) {
                output.textContent += text + '\n';
                output.scrollTop = output.scrollHeight;
            }
        };
        
        // Process each line
        for (let i = 0; i < executableCode.length; i++) {
            const line = executableCode[i].trim();
            if (!line || line.startsWith('//')) continue;
            
            try {
                processLine(line, env, i + startIndex + 2);
            } catch (error) {
                throw new Error(`Line ${i + startIndex + 2}: ${error.message}`);
            }
        }
    }
    
    function processLine(line, env, lineNumber) {
        // Variable assignment
        if (line.includes('=') && !line.includes('agar_ye') && !line.includes('jab_tak') && !line.includes('ye_baar_baar_kar')) {
            const parts = line.split('=').map(p => p.trim());
            if (parts.length !== 2) {
                throw new Error("Bosdk! Invalid syntax");
            }
            
            const varName = parts[0];
            const value = evaluateExpression(parts[1], env);
            
            // Check if it's a constant
            if (line.startsWith('yaad_rakhna')) {
                const constName = line.split(' ')[1];
                if (env.constants[constName] !== undefined) {
                    throw new Error(`Bosdk! Constant '${constName}' cannot be changed`);
                }
                env.constants[constName] = value;
            } else {
                if (env.constants[varName] !== undefined) {
                    throw new Error(`Bosdk! Constant '${varName}' cannot be changed`);
                }
                env.variables[varName] = value;
            }
            return;
        }
        
        // bol_bkl function
        if (line.startsWith('bol_bkl(')) {
            const arg = line.substring(8, line.length - 1);
            const value = evaluateExpression(arg, env);
            env.bol_bkl(value);
            return;
        }
        
        // if condition
        if (line.startsWith('agar_ye (')) {
            const condition = line.substring(9, line.length - 1);
            const result = evaluateExpression(condition, env);
            
            if (!result) {
                // Skip to warna or next block
                let skipLines = 0;
                for (let j = lineNumber; j < env.codeLines.length; j++) {
                    if (env.codeLines[j].trim() === 'warna' || 
                        env.codeLines[j].trim().startsWith('agar_ye') ||
                        env.codeLines[j].trim().startsWith('ye_baar_baar_kar') ||
                        env.codeLines[j].trim().startsWith('jab_tak')) {
                        break;
                    }
                    skipLines++;
                }
                lineNumber += skipLines;
            }
            return;
        }
        
        // warna statement
        if (line === 'warna') {
            // Skip to next block
            let skipLines = 0;
            for (let j = lineNumber; j < env.codeLines.length; j++) {
                if (env.codeLines[j].trim().startsWith('agar_ye') ||
                    env.codeLines[j].trim().startsWith('ye_baar_baar_kar') ||
                    env.codeLines[j].trim().startsWith('jab_tak')) {
                    break;
                }
                skipLines++;
            }
            lineNumber += skipLines;
            return;
        }
        
        // for loop
        if (line.startsWith('ye_baar_baar_kar (')) {
            const loopParts = line.substring(18, line.length - 1).split(';').map(p => p.trim());
            if (loopParts.length !== 3) {
                throw new Error("Bosdk! Invalid for loop syntax");
            }
            
            // Initialization
            processLine(loopParts[0], env, lineNumber);
            
            // Loop condition
            while (evaluateExpression(loopParts[1], env)) {
                // Execute loop body
                const loopBody = [];
                let bodyLines = 0;
                for (let j = lineNumber + 1; j < env.codeLines.length; j++) {
                    if (env.codeLines[j].trim().startsWith('ye_baar_baar_kar') ||
                        env.codeLines[j].trim().startsWith('jab_tak') ||
                        env.codeLines[j].trim().startsWith('agar_ye')) {
                        break;
                    }
                    loopBody.push(env.codeLines[j]);
                    bodyLines++;
                }
                
                for (const bodyLine of loopBody) {
                    processLine(bodyLine, env, lineNumber);
                }
                
                // Update expression
                processLine(loopParts[2], env, lineNumber);
            }
            
            // Skip the loop body in main execution
            let skipLines = 0;
            for (let j = lineNumber + 1; j < env.codeLines.length; j++) {
                if (env.codeLines[j].trim().startsWith('ye_baar_baar_kar') ||
                    env.codeLines[j].trim().startsWith('jab_tak') ||
                    env.codeLines[j].trim().startsWith('agar_ye')) {
                    break;
                }
                skipLines++;
            }
            lineNumber += skipLines;
            return;
        }
        
        // while loop
        if (line.startsWith('jab_tak (')) {
            const condition = line.substring(9, line.length - 1);
            
            while (evaluateExpression(condition, env)) {
                // Execute loop body
                const loopBody = [];
                let bodyLines = 0;
                for (let j = lineNumber + 1; j < env.codeLines.length; j++) {
                    if (env.codeLines[j].trim().startsWith('ye_baar_baar_kar') ||
                        env.codeLines[j].trim().startsWith('jab_tak') ||
                        env.codeLines[j].trim().startsWith('agar_ye')) {
                        break;
                    }
                    loopBody.push(env.codeLines[j]);
                    bodyLines++;
                }
                
                for (const bodyLine of loopBody) {
                    processLine(bodyLine, env, lineNumber);
                }
            }
            
            // Skip the loop body in main execution
            let skipLines = 0;
            for (let j = lineNumber + 1; j < env.codeLines.length; j++) {
                if (env.codeLines[j].trim().startsWith('ye_baar_baar_kar') ||
                    env.codeLines[j].trim().startsWith('jab_tak') ||
                    env.codeLines[j].trim().startsWith('agar_ye')) {
                    break;
                }
                skipLines++;
            }
            lineNumber += skipLines;
            return;
        }
        
        // If we get here, it's an unrecognized command
        throw new Error("Bosdk! Invalid syntax");
    }
    
    function evaluateExpression(expr, env) {
        // Handle string literals
        if (expr.startsWith('"') && expr.endsWith('"')) {
            return expr.substring(1, expr.length - 1);
        }
        
        // Handle number literals
        if (!isNaN(expr)) {
            return parseFloat(expr);
        }
        
        // Handle variables and constants
        if (env.variables[expr] !== undefined) {
            return env.variables[expr];
        }
        if (env.constants[expr] !== undefined) {
            return env.constants[expr];
        }
        
        // Handle concatenation with +
        if (expr.includes('+')) {
            const parts = expr.split('+').map(p => p.trim());
            return parts.map(p => evaluateExpression(p, env)).join('');
        }
        
        // Handle comparison operators
        const comparisonOps = ['>', '<', '>=', '<=', '==', '!='];
        for (const op of comparisonOps) {
            if (expr.includes(op)) {
                const parts = expr.split(op).map(p => p.trim());
                if (parts.length !== 2) continue;
                
                const left = evaluateExpression(parts[0], env);
                const right = evaluateExpression(parts[1], env);
                
                switch (op) {
                    case '>': return left > right;
                    case '<': return left < right;
                    case '>=': return left >= right;
                    case '<=': return left <= right;
                    case '==': return left == right;
                    case '!=': return left != right;
                }
            }
        }
        
        // Handle arithmetic operations
        const arithmeticOps = ['+', '-', '*', '/'];
        for (const op of arithmeticOps) {
            if (expr.includes(op)) {
                const parts = expr.split(op).map(p => p.trim());
                if (parts.length !== 2) continue;
                
                const left = evaluateExpression(parts[0], env);
                const right = evaluateExpression(parts[1], env);
                
                if (isNaN(left) || isNaN(right)) {
                    throw new Error("Bosdk! Arithmetic operation on non-numbers");
                }
                
                switch (op) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return left / right;
                }
            }
        }
        
        // If we get here, the variable/constant doesn't exist
        throw new Error(`Bosdk! '${expr}' not found`);
    }

    // Initialize scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {threshold: 0.1});

    // Observe all animatable elements
    document.querySelectorAll('.header, .main, .examples-section, .example-card').forEach(el => {
        observer.observe(el);
    });
});