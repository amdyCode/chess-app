import { TestBed } from '@angular/core/testing';

import { MoveHandler } from './move-handler';

describe('MoveHandler', () => {
  let service: MoveHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoveHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
