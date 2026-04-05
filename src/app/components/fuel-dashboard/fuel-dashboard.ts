import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
 
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
export class FuelDashboard implements OnInit {
  isLoading: boolean = true;
  readings: FuelReading[] = [];
  filteredReadings: FuelReading[] = [];
  generators: Generator[] = [];
 
  generatorCards: GenListItem[] = [];
  selectedGenerator: string = '';
  currentThreshold: number = 0;
 
  // --- Date Filter Variables ---
  startDate: string = '';
  endDate: string = '';
 
  // --- SVG Chart Variables ---
  svgWidth = 500;
  svgHeight = 200;
  svgLinePath = '';
  svgAreaPath = '';
  svgThresholdY = 0;
  chartPaddingLeft = 40;
 
  dataPoints: { x: number, y: number, label: string, value: number, isAlert: boolean, isFirst: boolean, isLast: boolean }[] = [];
  alertPoints: { x: number, y: number }[] = [];
  yAxisTicks: { value: number, y: number }[] = [];
  hoveredPoint: any = null;

  // --- NEW: Pagination Variables ---
  currentPage: number = 1;
  itemsPerPage: number = 5;
 
  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = lastWeek.toISOString().split('T')[0];
  }
 
  ngOnInit() {
    this.api.getGenerators().subscribe({
      next: (gens: any) => {
        this.generators = Array.isArray(gens) ? gens : [];
 
        this.api.getReadings().subscribe({
          next: (data: any[]) => {
            this.readings = Array.isArray(data) ? data : [];
            this.buildGeneratorList();
 
            if (this.generatorCards.length > 0) {
              this.selectGenerator(this.generatorCards[0].id);
            } else {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          },
          error: (err) => console.error('Failed to load readings', err)
        });
      },
      error: (err) => console.error('Failed to load generators', err)
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
    const startTimestamp = new Date(this.startDate).getTime();
    const endTimestamp = new Date(this.endDate + 'T23:59:59').getTime();
 
    this.filteredReadings = this.readings.filter(r => {
      const isCorrectGen = String(r.generatorId) === this.selectedGenerator;
      const readingTime = new Date(r.currentTimestamp).getTime();
      return isCorrectGen && readingTime >= startTimestamp && readingTime <= endTimestamp;
    });
    
    // Sort oldest to newest for the chart
    this.filteredReadings.sort((a, b) =>
      new Date(a.currentTimestamp).getTime() - new Date(b.currentTimestamp).getTime()
    );
 
    const selectedGen = this.generatorCards.find(g => g.id === this.selectedGenerator);
    this.currentThreshold = selectedGen ? selectedGen.minLevelRule : 0;
 
    this.generateSvgPaths();

    // NEW: Always reset to page 1 when filtering or changing tanks!
    // We reverse the array here just for the table so newest is on top (page 1)
    this.filteredReadings.reverse();
    this.currentPage = 1;
  }
 
  generateSvgPaths() {
    if (this.filteredReadings.length === 0) {
      this.svgLinePath = '';
      this.svgAreaPath = '';
      this.dataPoints = [];
      this.alertPoints = [];
      this.yAxisTicks = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
 
    const selectedGen = this.generatorCards.find(g => g.id === this.selectedGenerator);
    const capacity = selectedGen ? selectedGen.capacity : 1000;
 
    const maxReading = Math.max(...this.filteredReadings.map(r => r.currentFuellevel));
    const chartMax = Math.max(maxReading, this.currentThreshold, capacity) * 1.1;
 
    this.yAxisTicks = [];
    for (let i = 0; i <= 4; i++) {
      const tickValue = (chartMax / 4) * i;
      const yPos = this.svgHeight - ((tickValue / chartMax) * this.svgHeight);
      this.yAxisTicks.push({ value: Math.round(tickValue), y: yPos });
    }
 
    const drawingWidth = this.svgWidth - this.chartPaddingLeft;
    const stepX = drawingWidth / (this.filteredReadings.length > 1 ? this.filteredReadings.length - 1 : 1);
    
    let linePath = '';
    this.dataPoints = [];
    this.alertPoints = [];
    
    // Reverse it temporarily to draw the chart left-to-right (oldest to newest)
    const chartReadings = [...this.filteredReadings];

    chartReadings.forEach((reading, index) => {
      const x = this.chartPaddingLeft + (index * stepX);
      const y = this.svgHeight - ((reading.currentFuellevel / chartMax) * this.svgHeight);
      const isAlert = reading.currentFuellevel <= this.currentThreshold;
      
      this.dataPoints.push({
        x, y,
        label: reading.currentTimestamp,
        value: reading.currentFuellevel,
        isAlert: isAlert,
        isFirst: index === 0,
        isLast: index === chartReadings.length - 1
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
    this.svgAreaPath = `${linePath} L ${this.svgWidth},${this.svgHeight} L ${this.chartPaddingLeft},${this.svgHeight} Z`;
    this.svgThresholdY = this.svgHeight - ((this.currentThreshold / chartMax) * this.svgHeight);
 
    this.isLoading = false;
    this.cdr.detectChanges();
  }
 
  showTooltip(event: MouseEvent, pt: any) {
    // FIX: Updated the class name to perfectly match the new HTML
    const wrapper = (event.target as HTMLElement).closest('.svg-chart-wrapper') as HTMLElement;
    
    // Safety check to ensure it doesn't crash if your mouse moves too fast
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      
      this.hoveredPoint = {
        ...pt,
        mouseX: event.clientX - rect.left,
        mouseY: event.clientY - rect.top
      };
    }
  }
 
  hideTooltip() {
    this.hoveredPoint = null;
  }
 
  getBarColor(level: number, capacity: number): string {
    if (!capacity || capacity === 0) return '#EF4444';
    const percent = (level / capacity) * 100;
    if (percent > 40) return '#10B981';
    if (percent > 20) return '#F59E0B';
    return '#EF4444';
  }

  // --- NEW: Pagination Getters & Methods ---
  get totalPages(): number {
    return Math.ceil(this.filteredReadings.length / this.itemsPerPage) || 1;
  }

  get paginatedReadings(): FuelReading[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredReadings.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}