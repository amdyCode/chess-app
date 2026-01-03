import { TestBed } from '@angular/core/testing';

import { MoveValidator } from './move-validator';

describe('MoveValidator', () => {
  let service: MoveValidator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoveValidator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
