/*
 ██████  █████  ██       ██████ ██    ██ ██       █████  ████████  ██████  ██████  
██      ██   ██ ██      ██      ██    ██ ██      ██   ██    ██    ██    ██ ██   ██ 
██      ███████ ██      ██      ██    ██ ██      ███████    ██    ██    ██ ██████  
██      ██   ██ ██      ██      ██    ██ ██      ██   ██    ██    ██    ██ ██   ██ 
 ██████ ██   ██ ███████  ██████  ██████  ███████ ██   ██    ██     ██████  ██   ██ 
*/

const ForecastCalculator = {
    /**
     * Calculates the final amount using simple interest formula
     * Formula: A = P(1 + rt) where:
     * A = Final amount
     * P = Principal
     * r = Interest rate (as decimal)
     * t = Time in years
     * 
     * @param {number} principal - Initial investment amount
     * @param {number} rate - Annual interest rate (as percentage)
     * @param {number} years - Investment period in years
     * @returns {number} Final amount after simple interest
     */
    calculateSimpleInterest(principal, rate, years) {
        return principal * (1 + (rate/100) * years);
    },

    /**
     * Calculates the final amount using compound interest formula
     * Formula: A = P(1 + r)^t where:
     * A = Final amount
     * P = Principal
     * r = Interest rate (as decimal)
     * t = Time in years
     * 
     * @param {number} principal - Initial investment amount
     * @param {number} rate - Annual interest rate (as percentage)
     * @param {number} years - Investment period in years
     * @returns {number} Final amount after compound interest
     */
    calculateCompoundInterest(principal, rate, years) {
        return principal * Math.pow(1 + rate/100, years);
    },

    /**
     * Generates data points for comparing simple and compound interest over time
     * Creates an array of year-by-year results for visualization
     * 
     * @param {number} initial - Initial investment amount
     * @param {number} rate - Annual interest rate (as percentage)
     * @param {number} years - Total investment period in years
     * @returns {Array<Object>} Array of yearly calculation results
     * @returns {number} return[].year - Year number
     * @returns {number} return[].simpleInterest - Amount with simple interest
     * @returns {number} return[].compoundInterest - Amount with compound interest
     */
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