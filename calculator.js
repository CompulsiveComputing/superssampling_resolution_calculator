// calculator.js
let display = document.getElementById('display');
let historyDisplay = document.getElementById('history');
let currentInput = '';
let operator = '';
let firstOperand = null;
let history = [];

document.addEventListener('keydown', handleKeyPress);

function appendNumber(number) {
    if (currentInput.includes('.') && number === '.') return;
    currentInput += number;
    updateDisplay();
}

function appendOperator(op) {
    if (currentInput === '' && firstOperand === null) return;
    if (currentInput !== '') {
        if (firstOperand === null) {
            firstOperand = new BigFraction(currentInput);
        } else {
            calculate();
        }
    }
    operator = op;
    currentInput = '';
}

function clearDisplay() {
    currentInput = '';
    operator = '';
    firstOperand = null;
    updateDisplay('0');
    addToHistory('C');
}

function calculate() {
    if (currentInput === '' || firstOperand === null || operator === '') return;
    const secondOperand = new BigFraction(currentInput);
    let result;
    switch (operator) {
        case '+':
            result = firstOperand.addF(secondOperand).simplify();
            break;
        case '-':
            result = firstOperand.subtractF(secondOperand).simplify();
            break;
        case '*':
            result = firstOperand.multiplyF(secondOperand).simplify();
            break;
        case '/':
            try {
                result = firstOperand.divideF(secondOperand).simplify();
            } catch (error) {
                alert('Division by zero is not allowed');
                clearDisplay();
                return;
            }
            break;
    }
    updateDisplay(result.to_string_float());
    addToHistory(`${formatNumberOrFraction(firstOperand)} ${operator} ${formatNumberOrFraction(secondOperand)} = ${formatNumberOrFraction(result)}`);
    firstOperand = result;
    currentInput = '';
    operator = '';
}

function updateDisplay(value) {
    display.innerText = value !== undefined ? value : currentInput || (firstOperand ? firstOperand.to_string_float(100) : '0');
}

function addToHistory(entry) {
    history.push(entry);
    if (history.length > 10) history.shift();
    historyDisplay.innerHTML = history.join('<br>');
}

function formatNumberOrFraction(fraction) {
    if (fraction.hasAtLeastNFractionalDigits(3)) {
        const { wholePart, fractionalPart } = fraction.splitFraction();
        return `<span class="mixed-number">${wholePart !== 0n ? wholePart.toString() + ' ' : ''}<span class="fraction"><span class="numerator">${fractionalPart.numerator}</span><span class="denominator">${fractionalPart.denominator}</span></span></span>`;
    } else {
        return fraction.to_string_float();
    }
}

function handleKeyPress(event) {
    const key = event.key;
    if (!isNaN(key) || key === '.') {
        appendNumber(key);
    } else if (['+', '-', '*', '/'].includes(key)) {
        appendOperator(key);
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Escape' || key === 'C' || key === 'c') {
        clearDisplay();
    }
}
