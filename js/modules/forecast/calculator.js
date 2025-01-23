const ForecastCalculator = {
    calculateSimpleInterest(principal, rate, years) {
        return principal * (1 + (rate/100) * years);
    },

    calculateCompoundInterest(principal, rate, years) {
        return principal * Math.pow(1 + rate/100, years);
    },

    generateForecastData(initial, rate, years) {
        const data = [];
        for (let year = 0; year <= years; year++) {
            data.push({
                year,
                simpleInterest: this.calculateSimpleInterest(initial, rate, year),
                compoundInterest: this.calculateCompoundInterest(initial, rate, year)
            });
        }
        return data;
    }
};