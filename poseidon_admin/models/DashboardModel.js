export class DashboardModel {
    static getMetrics() {
        return {
            fishponds: {
                total: 12,
                active: 8,
                maintenance: 4
            },
            workers: {
                total: 5,
                assigned: 3,
                available: 2
            },
            waterQuality: {
                percentage: 83,
                status: "Good"
            },
            systemStatus: "Online"
        };
    }

    static getWaterQualityDetails() {
        return {
            ph: 7.2,
            dissolvedOxygen: 6.8,
            temperature: 28
        };
    }
}
