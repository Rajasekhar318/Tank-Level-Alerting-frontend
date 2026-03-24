import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanel implements OnInit {

  availableGenerators: any[] = [];
  fuelMachines: any[] = [];

  selectedGeneratorId: number | null = null;
  selectedGenerator: any = null;

  selectedEndpoint: string = 'readings';
  jsonPayload: string = '{\n  "generatorId": 1,\n  "currentFuellevel": 50\n}';
  lastResponse: any = null;
  responseStatus: string = '';

  genStatus: { type: 'success' | 'error' | '', message: string } = { type: '', message: '' };
  readingStatus: { type: 'success' | 'error' | '', message: string } = { type: '', message: '' };

  // =========================
  // FORMS
  // =========================

  generatorForm = new FormGroup({
    generatorTotalCapacity: new FormControl('', [Validators.required, Validators.min(1)]),
    generatorHighLevelpoint: new FormControl('', [Validators.required, Validators.min(1)]),
    generatorLowLevelpoint: new FormControl('', [Validators.required, Validators.min(1)])
  });

  readingForm = new FormGroup({
    generatorId: new FormControl<number | string | null>(null, [Validators.required]),
    currentFuellevel: new FormControl('', [Validators.required, Validators.min(0)]),
    currentTimestamp: new FormControl(this.getCurrentDateTimeLocal(), [Validators.required])
  });

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  // =========================
  // INIT & REFRESH
  // =========================

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.fetchGenerators();
    this.fetchMachines();
  }

  fetchGenerators() {
    this.api.getGenerators().subscribe({
      next: (data: any[]) => {
        this.availableGenerators = data;
        if (this.availableGenerators.length > 0) {
          if (!this.selectedGeneratorId) {
             this.selectedGeneratorId = this.availableGenerators[0].generatorId;
          }
          this.updateSelectedGenerator();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Failed to load generators', err)
    });
  }

  fetchMachines() {
    this.api.getAlerts().subscribe({
      next: (data: any[]) => {
        this.fuelMachines = data;
        this.cdr.detectChanges(); 
      },
      error: (err: any) => console.error('Failed to load fuel machines', err)
    });
  }

  updateSelectedGenerator() {
    if (!this.selectedGeneratorId) {
      this.selectedGenerator = null;
      return;
    }
    this.selectedGenerator = this.availableGenerators.find(
      g => g.generatorId === this.selectedGeneratorId
    ) || null;
  }

  // =========================
  // CONTROL PANEL LOGIC
  // =========================

  startGenerator() {
    if (!this.selectedGeneratorId) return;
    this.api.startGenerator(this.selectedGeneratorId).subscribe({
      next: () => this.fetchGenerators(),
      error: (err: any) => console.error(err)
    });
  }

  stopGenerator() {
    if (!this.selectedGeneratorId) return;
    this.api.stopGenerator(this.selectedGeneratorId).subscribe({
      next: () => this.fetchGenerators(),
      error: (err: any) => console.error(err)
    });
  }

  startFuelMachine() {
    const globalMachineId = 1;
    this.api.startMachine(globalMachineId).subscribe({
      next: (updatedMachine: any) => {
        console.log('Fuel Machine 1 Started:', updatedMachine);
        if (this.fuelMachines && this.fuelMachines.length > 0) {
          this.fuelMachines[0] = { ...updatedMachine };
        } else {
          this.fuelMachines = [updatedMachine];
        }
        this.cdr.detectChanges(); 
      },
      error: (err: any) => alert('Machine with ID 1 not found in database.')
    });
  }

  stopFuelMachine() {
    const globalMachineId = 1;
    this.api.stopMachine(globalMachineId).subscribe({
      next: (updatedMachine: any) => {
        console.log('Fuel Machine 1 Stopped:', updatedMachine);
        if (this.fuelMachines && this.fuelMachines.length > 0) {
          this.fuelMachines[0] = { ...updatedMachine };
        } else {
          this.fuelMachines = [updatedMachine];
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error(err)
    });
  }

  // =========================
  // FORM SUBMISSION & HELPERS
  // =========================

  getCurrentDateTimeLocal(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  submitGenerator() {
    if (this.generatorForm.valid) {
      const val = this.generatorForm.value;
      const payload = {
        generatorTotalCapacity: Number(val.generatorTotalCapacity),
        generatorHighLevelpoint: Number(val.generatorHighLevelpoint),
        generatorLowLevelpoint: Number(val.generatorLowLevelpoint)
      };
      this.api.addGenerator(payload).subscribe({
        next: () => {
          this.genStatus = { type: 'success', message: 'Generator registered!' };
          this.generatorForm.reset();
          this.fetchGenerators();
          setTimeout(() => this.genStatus = { type: '', message: '' }, 4000);
        }
      });
    }
  }

  submitReading() {
    if (this.readingForm.valid) {
      const val = { ...this.readingForm.value };
      
      // FIX: Ensure timestamp is local time exactly as typed (no UTC offset conversion)
      let timeString = val.currentTimestamp!;
      if (timeString.length === 16) timeString += ':00';

      const payload = {
        generatorId: val.generatorId,
        currentFuellevel: Number(val.currentFuellevel),
        currentTimestamp: timeString
      };
      this.api.addReading(payload).subscribe({
        next: () => {
          this.readingStatus = { type: 'success', message: 'Reading submitted!' };
          this.readingForm.patchValue({ currentFuellevel: '' });
          setTimeout(() => this.readingStatus = { type: '', message: '' }, 4000);
        }
      });
    }
  }

  sendManualRequest() {
    try {
      const payload = JSON.parse(this.jsonPayload);
      this.api.manualPost(this.selectedEndpoint, payload).subscribe({
        next: (res: any) => {
          this.lastResponse = res;
          this.responseStatus = '200 OK';
          this.refreshData();
        },
        error: (err: any) => {
          this.lastResponse = err.error || err.message;
          this.responseStatus = `Error: ${err.status}`;
        }
      });
    } catch (e) {
      alert("Invalid JSON format!");
    }
  }
}