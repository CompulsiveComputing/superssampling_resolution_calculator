"use strict";

// ██████╗ ██╗ ██████╗     ███████╗██████╗  █████╗  ██████╗████████╗██╗ ██████╗ ███╗   ██╗
// ██╔══██╗██║██╔════╝     ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
// ██████╔╝██║██║  ███╗    █████╗  ██████╔╝███████║██║        ██║   ██║██║   ██║██╔██╗ ██║
// ██╔══██╗██║██║   ██║    ██╔══╝  ██╔══██╗██╔══██║██║        ██║   ██║██║   ██║██║╚██╗██║
// ██████╔╝██║╚██████╔╝    ██║     ██║  ██║██║  ██║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
// ╚═════╝ ╚═╝ ╚═════╝     ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝


class BigFraction {
    constructor(in_numerator, in_denominator) {

        if (in_numerator instanceof BigFraction && !in_denominator) {
            this.numerator = in_numerator.numerator;
            this.denominator = in_numerator.denominator;
            return;
        } 

        let temp_num = {numerator: null, denominator: null};
        let temp_dem = {numerator: null, denominator: null};

        if (in_numerator instanceof BigFraction) {
            temp_num.numerator = in_numerator.numerator;
            temp_num.denominator = in_numerator.denominator;
        } 
        else
        switch (typeof in_numerator) {
            case 'number':{
                const fraction = BigFraction.#floatToBigIntFraction(in_numerator);
                temp_num.numerator = fraction.numerator;
                temp_num.denominator = fraction.denominator;
                break;
            }
            case 'bigint':
                temp_num.numerator = in_numerator;
                temp_num.denominator = 1n;
                break;
            case 'string':
                {
                    const fraction = BigFraction.#from_decimal_string(in_numerator);
                    temp_num.numerator = fraction.numerator;
                    temp_num.denominator = fraction.denominator;
                    break;
                }
            default:
                throw new Error('Unknown in_numerator type.');
        }

        if (!in_denominator) {
            temp_dem.numerator = 1n;
            temp_dem.denominator = 1n;
        }
        else {
            if (in_denominator instanceof BigFraction) {
                temp_dem.numerator = in_denominator.numerator;
                temp_dem.denominator = in_denominator.denominator;
            } 
            else
            switch (typeof in_denominator) {
                case 'number':{
                    const fraction = BigFraction.#floatToBigIntFraction(in_denominator);
                    temp_dem.numerator = fraction.numerator;
                    temp_dem.denominator = fraction.denominator;
                    break;
                }
                case 'bigint':
                    temp_dem.numerator = in_denominator;
                    temp_dem.denominator = 1n;
                    break;
                case 'string':
                    {
                        const fraction = BigFraction.#from_decimal_string(in_denominator);
                        temp_dem.numerator = fraction.numerator;
                        temp_dem.denominator = fraction.denominator;
                        break;
                    }
                default:
                    throw new Error('Unknown in_denominator type.');
            }
        }
        
        const consolidated_numerator = temp_num.numerator * temp_dem.denominator;
        const consolidated_denominator = temp_num.denominator * temp_dem.numerator;

        const gcd = BigFraction.gcdBigInt(consolidated_numerator, consolidated_denominator);

        this.numerator = consolidated_numerator / gcd;
        this.denominator = consolidated_denominator / gcd;
    }

    static decimalSeparator;
    static thousandsSeparator;

    static {
        const numberWithDecimals = 1234567.89;
        const formattedNumber = numberWithDecimals.toLocaleString();
        BigFraction.decimalSeparator = formattedNumber.match(/[^0-9]/g).pop();
        BigFraction.thousandsSeparator = formattedNumber.match(/[^0-9]/g)[0];
    }

    static simplify_BigInt(numerator, denominator) {
        const gcd = BigFraction.gcdBigInt(numerator, denominator);
        return {
            numerator: numerator / gcd,
            denominator: denominator / gcd
        };
    }

    static one() {
        return new BigFraction(1n,1n);
    }

    static zero() {
        return new BigFraction(0n,1n);
    }

    static gcd(aFraction, bFraction) {
        // Ensure the inputs are instances of BigFraction
        if (!(aFraction instanceof BigFraction) || !(bFraction instanceof BigFraction)) {
            throw new Error('Both arguments must be instances of BigFraction');
        }

        // Convert the fractions to a common denominator
        const aNumerator = aFraction.numerator * bFraction.denominator;
        const bNumerator = bFraction.numerator * aFraction.denominator;
        const commonDenominator = aFraction.denominator * bFraction.denominator;

        // Calculate the GCD of the numerators
        const gcdNumerator = BigFraction.gcdBigInt(aNumerator, bNumerator);

        // The denominator of the GCD fraction will be the common denominator
        return new BigFraction(gcdNumerator, commonDenominator).simplify();
    }

    static gcdBigInt(a, b) {
        a = a > 0 ? a : -a;
        b = b > 0 ? b : -b;
        while (b != 0n) {
            [a, b] = [b, a % b];
        }
        return a;
    }

    static min(a,b){
        return (a.less_or_equal_toF(b)) ? a : b;
    }

    static #floatToBigIntFraction(float) {
        const buffer = new ArrayBuffer(8);
        const floatView = new Float64Array(buffer);
        const intView = new BigInt64Array(buffer);
        floatView[0] = float;
        let bits = intView[0];
    
        // Special case for zero
        if (float === 0) {
            return {
                numerator: BigInt(0),
                denominator: BigInt(1)
            };
        }
    
        const signMask = BigInt(0x8000000000000000);
        const exponentMask = BigInt(0x7FF0000000000000);
        const mantissaMask = BigInt(0x000FFFFFFFFFFFFF);
        const bias = BigInt(1023);
        const leadingOne = BigInt(0x0010000000000000);
    
        const signBit = (bits & signMask) >> BigInt(63);
        const storedExponent = (bits & exponentMask) >> BigInt(52);
        const mantissa = bits & mantissaMask;
        const trueExponent = storedExponent - bias;
        const fullMantissa = mantissa + leadingOne;
    
        let numerator = fullMantissa;
        let denominator = BigInt(1) << BigInt(52);
    
        if (trueExponent > 0) {
            numerator *= BigInt(2) ** trueExponent;
        } else if (trueExponent < 0) {
            denominator *= BigInt(2) ** (-trueExponent);
        }
    
        if (signBit === BigInt(1)) {
            numerator = -numerator;
        }
    
        return {
            numerator: numerator,
            denominator: denominator
        };
    }
    
    static from_float(value) {
        if (typeof value !== 'number') throw new TypeError('Input must be a number');
        const fraction = BigFraction.#floatToBigIntFraction(value);
        return new BigFraction(fraction.numerator, fraction.denominator);
    }

    static from_int(value) {
        if (typeof value !== 'number' || !Number.isInteger(value)) throw new TypeError('Input must be an integer');
        return new BigFraction(BigInt(value));
    }

    static from_bigint(value) {
        if (typeof value !== 'bigint') throw new TypeError('Input must be a BigInt');
        return new BigFraction(value, 1n);
    }

    static #from_decimal_string(decimalString) {
        // Handle potential leading sign
        const sign = decimalString[0] === '-' ? -1n : 1n;
        if (decimalString[0] === '+' || decimalString[0] === '-') {
            decimalString = decimalString.substring(1);
        }
    
        // Split the string into whole and decimal parts
        let [whole, decimal] = decimalString.split('.');
        if (!decimal) decimal = "";  // Handle cases without a decimal part
    
        // Convert string parts to BigInt
        const wholePart = BigInt(whole || "0") * sign;
        let denominator = 1n; // Default denominator for integer values
        let numerator = wholePart; // For integers, numerator is the whole part

        if (decimal.length > 0) {
            const decimalPart = BigInt(decimal);
            denominator = BigInt('1' + '0'.repeat(decimal.length)); // 10^n where n is the number of decimal places
            numerator = wholePart * denominator + decimalPart * sign; // Recalculate numerator for decimal values
        }

        // Reduce fraction by GCD
        const gcd = BigFraction.gcdBigInt(numerator, denominator);
        if(gcd != 1n) {
            numerator /= gcd;
            denominator /= gcd;
        }

        return {
            numerator: numerator,
            denominator: denominator
        };
    }

    hasAtLeastNFractionalDigits(N) {
        // Ensure the input is a positive integer
        if (typeof N !== 'number' || N < 1 || !Number.isInteger(N)) {
            throw new TypeError('N must be a positive integer');
        }

        // Simplify the fraction
        const gcd = BigFraction.gcdBigInt(this.numerator, this.denominator);
        const simplifiedNumerator = this.numerator / gcd;
        const simplifiedDenominator = this.denominator / gcd;

        // If the denominator is not a power of 2 or 5, it has infinite decimal places
        if (!isPowerOfTwoOrFive(simplifiedDenominator)) {
            return true;
        }

        // Calculate the number of digits in the decimal representation
        let fractionalDigits = countDecimalDigits(simplifiedNumerator, simplifiedDenominator);

        // Check if the number of fractional digits is at least N
        return fractionalDigits >= N;

        function isPowerOfTwoOrFive(n) {
            while (n % 2n === 0n) {
                n /= 2n;
            }
            while (n % 5n === 0n) {
                n /= 5n;
            }
            return n === 1n;
        }
    
        function countDecimalDigits(numerator, denominator) {
            let count = 0;
            let value = numerator % denominator;
            let seenRemainders = new Map();
    
            while (value !== 0n) {
                if (seenRemainders.has(value)) {
                    return Infinity; // It means it's a repeating decimal
                }
                seenRemainders.set(value, count);
                value *= 10n;
                value %= denominator;
                count++;
            }
    
            return count;
        }
    }

    /**
     * Splits the fraction into its whole and fractional parts.
     * @returns {Object} A tuple containing wholePart as a bigint and fractionalPart as null or {numerator: bigint, denominator: bigint}
     */
    splitFraction() {
        const wholePart = this.numerator / this.denominator;
        const remainder = this.numerator % this.denominator;
        
        let fractionalPart = null;
        if (remainder !== 0n) {
            fractionalPart = {
                numerator: remainder,
                denominator: this.denominator
            };
        }

        return { wholePart, fractionalPart };
    }

    addF(fraction) {
        if (this.denominator === fraction.denominator) {
            // Case: Equal denominators
            const numerator = this.numerator + fraction.numerator;
            const denominator = this.denominator;
            const simpler = BigFraction.simplify_BigInt(numerator, denominator);
            return new BigFraction(simpler.numerator, simpler.denominator);
        } else {
            // General case
            const numerator = this.numerator * fraction.denominator + fraction.numerator * this.denominator;
            const denominator = this.denominator * fraction.denominator;
            const simpler = BigFraction.simplify_BigInt(numerator, denominator);
            return new BigFraction(simpler.numerator, simpler.denominator);
        }
    }    

    subtractF(fraction) {
        if (this.denominator === fraction.denominator) {
            // Case: Equal denominators
            const numerator = this.numerator - fraction.numerator;
            const denominator = this.denominator;
            const simpler = BigFraction.simplify_BigInt(numerator, denominator);
            return new BigFraction(simpler.numerator, simpler.denominator);
        } else {
            // General case
            const numerator = this.numerator * fraction.denominator - fraction.numerator * this.denominator;
            const denominator = this.denominator * fraction.denominator;
            const simpler = BigFraction.simplify_BigInt(numerator, denominator);
            return new BigFraction(simpler.numerator, simpler.denominator);
        }
    }

    multiplyF(fraction) {
        let numerator, denominator;

        if (this.denominator === fraction.denominator) {
            // Case 1: Equal denominators
            numerator = this.numerator * fraction.numerator;
            denominator = this.denominator;
        } else if (this.denominator === 1n) {
            // Case 2: This fraction's denominator is 1
            numerator = this.numerator * fraction.numerator;
            denominator = fraction.denominator;
        } else if (fraction.denominator === 1n) {
            // Case 3: Other fraction's denominator is 1
            numerator = this.numerator * fraction.numerator;
            denominator = this.denominator;
        } else {
            // General case
            numerator = this.numerator * fraction.numerator;
            denominator = this.denominator * fraction.denominator;
        }

        const simpler = BigFraction.simplify_BigInt(numerator, denominator);
        return new BigFraction(simpler.numerator, simpler.denominator);
    }

    divideF(fraction) {
        if (fraction.numerator === 0n) throw new Error('Cannot divide by zero');
        const numerator = this.numerator * fraction.denominator;
        const denominator = this.denominator * fraction.numerator;
    
        const simpler = BigFraction.simplify_BigInt(numerator, denominator);
        return new BigFraction(simpler.numerator, simpler.denominator);
    }
    

    simplify() {
        const simpler = BigFraction.simplify_BigInt(this.numerator, this.denominator);
        return new BigFraction(simpler.numerator, simpler.denominator);
    }

    is_one() {
        return this.numerator === this.denominator;
    }

    is_zero() {
        return this.numerator === 0n;
    }

    is_integral() {
        return this.numerator % this.denominator === 0n;
    }

    to_float() {
        return Number(this.numerator) / Number(this.denominator);
    }

    to_string_float(precision = 20) {
        const num = this.numerator;
        const den = this.denominator;
    
        if (den === 0n) throw new Error('Cannot divide by zero');
    
        const isNegative = (num < 0n) !== (den < 0n);
        const absNum = num < 0n ? -num : num;
        const absDen = den < 0n ? -den : den;
    
        const integerPart = absNum / absDen;
        let remainder = absNum % absDen;
    
        let decimalPart = "";
        const visited = new Map();
        let index = 0;
        while (remainder !== 0n && index < precision) {
            if (visited.has(remainder)) {
                const repeatStart = visited.get(remainder);
                decimalPart = decimalPart.slice(0, repeatStart) + decimalPart.slice(repeatStart);
                break;
            }
    
            visited.set(remainder, index);
            remainder *= 10n;
            const decimalDigit = remainder / absDen;
            decimalPart += decimalDigit.toString();
            remainder %= absDen;
            index += 1;
        }
    
        let result = (decimalPart == "") ? `${integerPart}` : `${integerPart}${BigFraction.decimalSeparator}${decimalPart}`;
    
        const addSeparators = (numberString) => {
            let parts = numberString.split(BigFraction.decimalSeparator);
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, BigFraction.thousandsSeparator);
            return parts.join(BigFraction.decimalSeparator);
        };
    
        result = addSeparators(result);
    
        return isNegative ? `-${result}` : result;
    }
    

    to_string_fraction() {
        return `${this.numerator}/${this.denominator}`;
    }

    to_int() {
        return this.is_integral() ? Number(this.numerator / this.denominator) : Math.floor(this.to_float());
    }

    to_BigInt() {
        return this.is_integral() ? this.numerator / this.denominator : BigInt(Math.floor(this.to_float()));
    }

    reciprocal() {
        return new BigFraction(this.denominator, this.numerator);
    }

    compareF(fraction) {
        const lhs = this.numerator * fraction.denominator;
        const rhs = fraction.numerator * this.denominator;
        if (lhs < rhs) return -1;
        if (lhs > rhs) return 1;
        return 0;
    }

    powerF(exp) {
        const exponent = BigFraction.toBigFraction(exp);
        if (exponent.denominator !== 1n) throw new Error('Fractional powers are not supported');
        const powerNumerator = BigInt(Math.pow(Number(this.numerator), Number(exponent.numerator)));
        const powerDenominator = BigInt(Math.pow(Number(this.denominator), Number(exponent.numerator)));
        return new BigFraction(powerNumerator, powerDenominator).simplify();
    }

    rootN(n) {
        const nthRoot = BigInt(n);
        if (nthRoot < 1n) throw new Error('Root must be greater than zero');
        const rootNumerator = BigInt(Math.pow(Number(this.numerator), 1 / Number(nthRoot)));
        const rootDenominator = BigInt(Math.pow(Number(this.denominator), 1 / Number(nthRoot)));
        return new BigFraction(rootNumerator, rootDenominator).simplify();
    }

    equal_toF(fraction) {
        return this.compareF(fraction) === 0;
    }

    equals(other) {
        if (!(other instanceof BigFraction)) {
            return false;
        }
        return this.numerator === other.numerator && this.denominator === other.denominator;
    }

    less_thanF(fraction) {
        return this.compareF(fraction) < 0n;
    }

    less_or_equal_toF(fraction) {
        return this.compareF(fraction) <= 0n;
    }

    greater_thanF(fraction) {
        return this.compareF(fraction) > 0n;
    }

    greater_or_equal_toF(fraction) {
        return this.compareF(fraction) >= 0n;
    }

    floorDivideF(fraction) {
        const numerator = this.numerator * fraction.denominator;
        const denominator = this.denominator * fraction.numerator;
        const result = numerator / denominator;
        return new BigFraction(result, 1n);
    }

    modF(fraction) {
        const quotient = this.floorDivideF(fraction);
        const product = quotient.multiplyF(fraction);
        return this.subtractF(product);
    }

    abs() {
        const numerator = BigIntabs(this.numerator);
        const denominator = BigIntabs(this.denominator);
        return new BigFraction(numerator, denominator);

        function BigIntabs(n){
            return (n === -0 || n < 0n) ? -n : n;
        }
    }
}