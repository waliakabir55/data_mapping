// src/lib/metrics.ts
import { MetricEntry, AggregateMetrics } from '@/types';

class MetricsManager {
    private metrics: MetricEntry[] = [];
    private readonly costPerToken = {
        'gpt-4': 0.00003,
        'gpt-3.5-turbo': 0.000002
    };

    addMetric(metric: MetricEntry) {
        this.metrics.push(metric);
        
        // Keep only the last 1000 metrics
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
    }

    getAggregateMetrics(): AggregateMetrics {
        if (this.metrics.length === 0) {
            return {
                totalProcessed: 0,
                successRate: 0,
                averageProcessingTime: 0,
                totalCost: 0,
                schemaEvolutionRate: 0
            };
        }

        const totalProcessed = this.metrics.length;
        const successRate = this.metrics.filter(m => m.successfulParse).length / totalProcessed;
        const averageProcessingTime = this.metrics.reduce((acc, m) => 
            acc + (m.endTime - m.startTime), 0) / totalProcessed;
        const totalCost = this.metrics.reduce((acc, m) => acc + m.modelCost, 0);
        
        return {
            totalProcessed,
            successRate,
            averageProcessingTime,
            totalCost,
            schemaEvolutionRate: this.metrics.filter(m => 
                m.schemaEvolutionSuggested).length / totalProcessed
        };
    }

    getRecentMetrics(minutes: number = 5): AggregateMetrics {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        const recentMetrics = this.metrics.filter(m => m.startTime > cutoff);
        
        // Create a new MetricsManager instance for recent metrics
        const recentManager = new MetricsManager();
        recentMetrics.forEach(metric => recentManager.addMetric(metric));
        
        return recentManager.getAggregateMetrics();
    }
}

export const metricsManager = new MetricsManager();