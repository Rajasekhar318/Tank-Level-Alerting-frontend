import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Subscription, interval } from 'rxjs'; 

export interface FuelReading {
  levelreadingId?: number;
  generatorId: string | number;
  currentFuellevel: number;
  currentTimestamp: string;
}

export interface Generator {
  generatorId: string | number;
  generatorTotalCapacity: number;
  generatorHighLevelpoint: number;
  generatorLowLevelpoint: number;
}

export interface GenListItem {
  id: string;
  capacity: number;
  latestLevel: number;
  minLevelRule: number;
  status: string;
}

@Component({
  selector: 'app-fuel-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fuel-dashboard.html',
  styleUrls: ['./fuel-dashboard.css']
})
export class FuelDashboard implements OnInit, OnDestroy {
  isLoading: boolean = true;
  readings: FuelReading[] = [];
  filteredReadings: FuelReading[] = [];
  generators: Generator[] = [];
  private refreshSub?: Subscription;

  generatorCards: GenListItem[] = [];
  selectedGenerator: string = '';
  currentThreshold: number = 0;

  svgWidth = 500;
  svgHeight = 200;
  svgLinePath = '';
  svgAreaPath = '';
  svgThresholdY = 0;

  dataPoints: { x: number, y: number, label: string, value: number, isFirst: boolean, isLast: boolean, isAlert: boolean }[] = [];
  alertPoints: { x: number, y: number }[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();

    this.refreshSub = interval(10000).subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }
  
  loadData(){
    this.api.getGenerators().subscribe({
      next: (gens: any) => {
        this.generators = Array.isArray(gens) ? gens : [];

        this.api.getReadings().subscribe({
          next: (data: any[]) => {
            this.readings = Array.isArray(data) ? data : [];
            this.buildGeneratorList();

            if (this.generatorCards.length > 0) {
              if (!this.selectedGenerator) {
                this.selectGenerator(this.generatorCards[0].id);
              } else {
                this.applyFilter();
              }
            } else {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          },
          error: (err) => console.error(err)
        });
      },
      error: (err) => console.error(err)
    });
  }

  buildGeneratorList() {
    this.generatorCards = this.generators.map(g => {
      const genIdStr = String(g.generatorId);
      const genReadings = this.readings.filter(r => String(r.generatorId) === genIdStr);
      
      genReadings.sort((a, b) => new Date(b.currentTimestamp).getTime() - new Date(a.currentTimestamp).getTime());
      const latest = genReadings.length > 0 ? genReadings[0].currentFuellevel : 0;

      return {
        id: genIdStr,
        capacity: g.generatorTotalCapacity,
        latestLevel: latest,
        minLevelRule: g.generatorLowLevelpoint,
        status: g.generatorTotalCapacity > 0 ? 'ONLINE' : 'OFFLINE'
      };
    });
  }

  selectGenerator(id: string) {
    this.selectedGenerator = id;
    this.applyFilter();
  }

  applyFilter() {
    this.filteredReadings = this.readings.filter(r => String(r.generatorId) === this.selectedGenerator);
    
    this.filteredReadings.sort((a, b) =>
      new Date(a.currentTimestamp).getTime() - new Date(b.currentTimestamp).getTime()
    );

    const selectedGen = this.generatorCards.find(g => g.id === this.selectedGenerator);
    this.currentThreshold = selectedGen ? selectedGen.minLevelRule : 0;

    this.generateSvgPaths();
  }

  generateSvgPaths() {
    if (this.filteredReadings.length === 0) {
      this.svgLinePath = '';
      this.svgAreaPath = '';
      this.dataPoints = [];
      this.alertPoints = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const selectedGen = this.generatorCards.find(g => g.id === this.selectedGenerator);
    const capacity = selectedGen ? selectedGen.capacity : 1000;

    const maxReading = Math.max(...this.filteredReadings.map(r => r.currentFuellevel));
    const chartMax = Math.max(maxReading, this.currentThreshold, capacity) * 1.1;

    const stepX = this.svgWidth / (this.filteredReadings.length > 1 ? this.filteredReadings.length - 1 : 1);
    
    let linePath = '';
    this.dataPoints = [];
    this.alertPoints = [];

    this.filteredReadings.forEach((reading, index) => {
      const x = index * stepX;
      const y = this.svgHeight - ((reading.currentFuellevel / chartMax) * this.svgHeight);
      const isAlert = reading.currentFuellevel <= this.currentThreshold;
      
      this.dataPoints.push({
        x,
        y,
        label: reading.currentTimestamp,
        value: reading.currentFuellevel,
        isFirst: index === 0,
        isLast: index === this.filteredReadings.length - 1,
        isAlert: isAlert
      });

      if (isAlert) {
        this.alertPoints.push({ x, y });
      }

      if (index === 0) {
        linePath += `M ${x},${y} `;
      } else {
        linePath += `L ${x},${y} `;
      }
    });

    this.svgLinePath = linePath;
    this.svgAreaPath = `${linePath} L ${this.svgWidth},${this.svgHeight} L 0,${this.svgHeight} Z`;
    this.svgThresholdY = this.svgHeight - ((this.currentThreshold / chartMax) * this.svgHeight);

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  getBarColor(level: number, capacity: number): string {
    if (!capacity || capacity === 0) return '#ef4444';
    const percent = (level / capacity) * 100;
    if (percent > 40) return '#10b981';
    if (percent > 20) return '#f59e0b';
    return '#ef4444';
  }
}