import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PastDataAnalysisComponent } from './past-data-analysis'; // Name updated here
import { ApiService } from '../../services/api.service';

describe('PastDataAnalysisComponent', () => {
  let component: PastDataAnalysisComponent;
  let fixture: ComponentFixture<PastDataAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PastDataAnalysisComponent, HttpClientTestingModule],
      providers: [ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(PastDataAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});