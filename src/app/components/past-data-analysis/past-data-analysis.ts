import { Component, OnInit, OnDestroy, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-past-data-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './past-data-analysis.html',
  styleUrls: ['./past-data-analysis.css']
})
export class PastDataAnalysisComponent implements OnInit, OnDestroy {
  chart1: any; chart2: any; chart3: any; chart4: any;

  // Queues to hold the SQL data for the infinite loop
  private dataQueues: { [key: number]: any[] } = { 1: [], 2: [], 3: [], 4: [] };
  private streamInterval: any;
  private dbPollingInterval: any;
  
  // Tracks the latest DB timestamp so we only pull truly NEW records
  private lastTimestamps: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };

  constructor(private api: ApiService) {
    afterNextRender(() => {
      this.createCharts();
      this.loadInitialDBData();
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    if (this.streamInterval) clearInterval(this.streamInterval);
    if (this.dbPollingInterval) clearInterval(this.dbPollingInterval);
    this.destroyCharts();
  }

  private destroyCharts() {
    [this.chart1, this.chart2, this.chart3, this.chart4].forEach(c => c?.destroy());
  }

  createCharts() {
    const commonOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { 
        duration: 700, 
        easing: 'linear' 
      },
      scales: {
        y: { beginAtZero: true },
        x: { ticks: { maxRotation: 45, minRotation: 45 } }
      }
    };

    const config = (label: string, color: string) => ({
      type: 'line' as const,
      data: { labels: [], datasets: [{ label, data: [], borderColor: color, backgroundColor: color + '33', fill: true, tension: 0.3 }] },
      options: commonOptions
    });

    this.chart1 = new Chart("gen1Chart", config('Gen 1 Fuel', '#3b82f6'));
    this.chart2 = new Chart("gen2Chart", config('Gen 2 Fuel', '#10b981'));
    this.chart3 = new Chart("gen3Chart", config('Gen 3 Fuel', '#f59e0b'));
    this.chart4 = new Chart("gen4Chart", config('Gen 4 Fuel', '#ef4444'));
  }

  // 1. Fetch SQL data ONCE to fill the queues
  loadInitialDBData() {
    this.api.getReadings().subscribe({
      next: (readings: any[]) => {
        for (let i = 1; i <= 4; i++) {
          const genReadings = readings
            .filter(r => Number(r.generatorId) === i)
            .sort((a, b) => new Date(a.currentTimestamp).getTime() - new Date(b.currentTimestamp).getTime());

          // Push historical DB data into our animation queues
          this.dataQueues[i] = genReadings.map(r => {
            const rawTime = new Date(r.currentTimestamp).getTime();
            this.lastTimestamps[i] = Math.max(this.lastTimestamps[i], rawTime);
            return {
              time: this.formatTime(r.currentTimestamp),
              value: Number(r.currentFuellevel)
            };
          });
        }
        
        // Start the 3-second animation loop and the background DB watcher
        this.startContinuousStream();
        this.startDBPolling();
      },
      error: (err) => console.error("Failed to load initial DB data", err)
    });
  }

  // 2. The Animation Loop (Every 3 seconds)
  startContinuousStream() {
    this.streamInterval = setInterval(() => {
      for (let i = 1; i <= 4; i++) {
        const chart = (this as any)[`chart${i}`];
        const queue = this.dataQueues[i];

        if (chart && queue && queue.length > 0) {
          // Take the oldest point out of the front of the queue
          const nextPoint = queue.shift(); 

          // Push it right back to the end of the queue to create the infinite loop!
          queue.push(nextPoint); 

          // Add it to the chart
          chart.data.labels.push(nextPoint.time);
          chart.data.datasets[0].data.push(nextPoint.value);

          // Keep the chart looking clean (max 20 points on screen)
          if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
          }

          chart.update('none'); // Slide it smoothly
        }
      }
    }, 1500); // 1500ms = 1.5 seconds exactly as requested
  }

  // 3. Background watcher for BRAND NEW inserts from your Admin Panel
  startDBPolling() {
    this.dbPollingInterval = setInterval(() => {
      this.api.getReadings().subscribe({
        next: (readings: any[]) => {
          for (let i = 1; i <= 4; i++) {
            const newReadings = readings
              .filter(r => Number(r.generatorId) === i)
              .filter(r => new Date(r.currentTimestamp).getTime() > this.lastTimestamps[i])
              .sort((a, b) => new Date(a.currentTimestamp).getTime() - new Date(b.currentTimestamp).getTime());

            if (newReadings.length > 0) {
              newReadings.forEach(r => {
                const rawTime = new Date(r.currentTimestamp).getTime();
                this.lastTimestamps[i] = rawTime;
                
                // Inject the brand new DB reading straight into the animation loop!
                this.dataQueues[i].push({
                  time: this.formatTime(r.currentTimestamp),
                  value: Number(r.currentFuellevel)
                });
              });
            }
          }
        },
        error: (err: any) => console.error("Live DB Sync error:", err)
      });
    }, 5000); 
  }

  formatTime(isoString: string) {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? isoString : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}