import { TestBed } from '@angular/core/testing';

import { MoveGenerator } from './move-generator';

describe('MoveGenerator', () => {
  let service: MoveGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoveGenerator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
