"use strict";


class BigFractionDimensions {
    constructor(width, height) {
        this.width = new BigFraction(width);
        this.height = new BigFraction(height);
    }

    static _gcd(a, b) {
        a = a.numerator > 0n ? a : -a;
        b = b.numerator > 0n ? b : -b;
        while (b.numerator !== 0n) {
            [a, b] = [b, a.modF(b)];
        }
        return a;
    }

    simplify() {
        const gcd = BigFractionDimensions._gcd(this.width, this.height);
        return new BigFractionDimensions(
            this.width.divideF(gcd),
            this.height.divideF(gcd)
        );
    }

    scale(multiplier) {
        return new BigFractionDimensions(
            this.width.multiplyF(multiplier),
            this.height.multiplyF(multiplier)
        );
    }

    descale(multiplier) {
        return new BigFractionDimensions(
            this.width.divideF(multiplier),
            this.height.divideF(multiplier)
        );
    }

    isIntegral() {
        return this.width.isIntegral() && this.height.isIntegral();
    }

    getCount(){
        return this.width.multiplyF(this.height);
    }

    exceedsBothAxis(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        return this.width.greater_thanF(other.width) && this.height.greater_thanF(other.height);
    }

    exceedsEitherAxis(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        return this.width.greater_thanF(other.width) || this.height.greater_thanF(other.height);
    }

    exceedsCount(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        return this.getCount().greater_thanFR(other.getCount());
    }

    isAligned(other) {
        return this.width.modF(other.width).numerator === 0n && this.height.modF(other.height).numerator === 0n;
    }

    toObject() {
        return { width: this.width.toString(), height: this.height.toString() };
    }

    largestScaleFactor(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        const ratioX = this.width.divideF(other.width);
        const ratioY = this.height.divideF(other.height);
        const largest = (ratioX.less_thanF(ratioY)) ? ratioX : ratioY;
        return largest;
    }

    toDimensionNotation() {
        return `${this.width.to_string_float()}x${this.height.to_string_float()}`;
    }

    static fromDimensionNotation(dimensionString) {
        const [width, height] = dimensionString.split('x');
        return new BigFractionDimensions(width, height);
    }

    toRatioNotation() {
        return `${this.width.to_string_float()}:${this.height.to_string_float()}`;
    }

    equals(other) {
        if (!(other instanceof BigFractionDimensions)) {
            return false;
        }
        return this.width.equals(other.width) && this.height.equals(other.height);
    }

    is_equalBFD(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        return this.width.is_equalF(other.width) && this.height.is_equalF(other.height);
    }
    
    greater_thanBFD(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        return this.numerator * other.denominator > other.numerator * this.denominator;
    }
    
    less_thanBFD(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        return this.numerator * other.denominator < other.numerator * this.denominator;
    }
    
    greater_or_eqBFD(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        return this.numerator * other.denominator >= other.numerator * this.denominator;
    }
    
    less_or_equalBFD(other) {
        if (!(other instanceof BigFractionDimensions)) {
            throw new TypeError('Argument must be an instance of BigFractionDimensions');
        }
        return this.numerator * other.denominator <= other.numerator * this.denominator;
    }
    
    abs() {
        return new BigFractionDimensions(
            this.width.abs(),
            this.height.abs()
        );
    }

    static fromRatioNotation(ratioString) {
        const [width, height] = ratioString.split(':');
        return new BigFractionDimensions(width, height);
    }
}