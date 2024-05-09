"use strict";
class BigFraction {
    constructor(numerator, denominator = 1n) {
        if (numerator instanceof BigFraction) {
            this.numerator = numerator.numerator;
            this.denominator = numerator.denominator;
            return;
        };
        if (typeof numerator === 'number') numerator = BigInt(Math.floor(numerator));
        if (typeof denominator === 'number') denominator = BigInt(Math.floor(denominator));

        if (denominator === 0n) throw new Error('Denominator cannot be zero');

        this.numerator = numerator;
        this.denominator = denominator;

        if (this.denominator < 0n) {
            this.numerator = -this.numerator;
            this.denominator = -this.denominator;
        }
    }

    static _gcd(a, b) {
        a = a > 0 ? a : -a;
        b = b > 0 ? b : -b;
        while (b != 0n) {
            [a, b] = [b, a % b];
        }
        return a;
    }

    static clone(value) {
        if (value instanceof BigFraction) {
            return new BigFraction(value.numerator, value.denominator);
        } else {
            throw new TypeError('Invalid input type');
        }
    }

    static from_float(value) {
        if (typeof value !== 'number') throw new TypeError('Input must be a number');
        const sign = Math.sign(value);
        value = Math.abs(value);
        const [integerPart, fractionalPart] = value.toString().split('.');
        const denominator = BigInt(10 ** (fractionalPart ? fractionalPart.length : 0));
        const numerator = BigInt(integerPart) * denominator + BigInt(fractionalPart || '0');
        return new BigFraction(BigInt(sign) * numerator, denominator);
    }

    static from_int(value) {
        if (typeof value !== 'number' || !Number.isInteger(value)) throw new TypeError('Input must be an integer');
        return new BigFraction(BigInt(value), 1n);
    }

    static from_bigint(value) {
        if (typeof value !== 'bigint') throw new TypeError('Input must be a BigInt');
        return new BigFraction(value, 1n);
    }

    addF(fraction) {
        const other = BigFraction.toBigFraction(fraction);
        const numerator = this.numerator * other.denominator + other.numerator * this.denominator;
        const denominator = this.denominator * other.denominator;
        return new BigFraction(numerator, denominator).simplify();
    }

    subtractF(fraction) {
        const other = BigFraction.toBigFraction(fraction);
        const numerator = this.numerator * other.denominator - other.numerator * this.denominator;
        const denominator = this.denominator * other.denominator;
        return new BigFraction(numerator, denominator).simplify();
    }

    multiplyF(fraction) {
        const other = BigFraction.toBigFraction(fraction);
        const numerator = this.numerator * other.numerator;
        const denominator = this.denominator * other.denominator;
        return new BigFraction(numerator, denominator).simplify();
    }

    divideF(fraction) {
        const other = BigFraction.toBigFraction(fraction);
        if (other.numerator === 0n) throw new Error('Cannot divide by zero');
        const numerator = this.numerator * other.denominator;
        const denominator = this.denominator * other.numerator;
        return new BigFraction(numerator, denominator).simplify();
    }

    simplify() {
        const gcd = BigFraction._gcd(this.numerator, this.denominator);
        return new BigFraction(this.numerator / gcd, this.denominator / gcd);
    }

    is_integral() {
        return this.numerator % this.denominator === 0n;
    }

    to_float() {
        return Number(this.numerator) / Number(this.denominator);
    }

    to_string_float() {

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
        const other = BigFraction.toBigFraction(fraction);
        const lhs = this.numerator * other.denominator;
        const rhs = other.numerator * this.denominator;
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

    less_thanF(fraction) {
        return this.compareF(fraction) < 0;
    }

    less_or_equal_toF(fraction) {
        return this.compareF(fraction) <= 0;
    }

    greater_thanF(fraction) {
        return this.compareF(fraction) > 0;
    }

    greater_or_equal_toF(fraction) {
        return this.compareF(fraction) >= 0;
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
}

class FractionalPair {
    constructor(width, height) {
        this.width = new BigFraction(width);
        this.height = new BigFraction(height);
    }

    simplify() {

    }

    scale(multiplier) {
        return new FractionalPair(
            this.width.multiplyF(scaledMultiplier),
            this.height.multiplyF(scaledMultiplier)
        );
    }

    descale(multiplier) {
        return new FractionalPair(
            this.width.divideF(scaledMultiplier),
            this.height.divideF(scaledMultiplier)
        );
    }

    isIntegral() {
        return this.width.isIntegral() && this.height.isIntegral();
    }

    getCount(){
        return this.width.multiplyF(this.height);
    }

    exceedsBothAxis(other) {

        return this.width.greater_thanF(other.width) && this.height.greater_thanF(other.height);
    }

    exceedsEitherAxis(other) {

        return this.width.greater_thanF(other.width) || this.height.greater_thanF(other.height);
    }

    exceedsCount(other) {
        return this.getCount().greater_thanF(other.getCount());
    }

    isAligned(other) {
        return this.width.modF(other.width).numerator === 0n && this.height.modF(other.height).numerator === 0n;
    }

    toObject() {
        return { width: this.width.toString(), height: this.height.toString() };
    }

    largestScaleFactor(other) {
        const ratioX = this.width.divideF(other.width);
        const ratioY = this.height.divideF(other.height);
        return new BigFraction(Math.min(Number(ratioX.toString()), Number(ratioY.toString())));
    }

    toDimensionNotation() {
        return `${this.width.toString()}x${this.height.toString()}`;
    }

    static fromDimensionNotation(dimensionString) {
        const [width, height] = dimensionString.split('x').map(Number);
        return new FractionalPair(width, height);
    }

    toRatioNotation() {
        return `${this.width.toString()}:${this.height.toString()}`;
    }

    is_equal(other) {
        return this.width.is_equalF(other.width) && this.height.is_equalF(other.height);
    }

    static fromRatioNotation(ratioString) {
        const [width, height] = ratioString.split(':').map(Number);
        return new FractionalPair(width, height);
    }
}