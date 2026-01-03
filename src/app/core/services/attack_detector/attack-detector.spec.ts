import { TestBed } from '@angular/core/testing';

import { AttackDetector } from './attack-detector';

describe('AttackDetector', () => {
  let service: AttackDetector;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttackDetector);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
