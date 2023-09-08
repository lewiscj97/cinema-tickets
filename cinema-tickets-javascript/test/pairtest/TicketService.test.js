import { expect } from 'chai';
import Chai from 'chai';
import SinonChai from 'sinon-chai';
import { createSandbox } from 'sinon';

import TicketService from '../../src/pairtest/TicketService.js';
import InvalidPurchaseException from '../../src/pairtest/lib/InvalidPurchaseException.js';
import TicketTypeRequest from '../../src/pairtest/lib/TicketTypeRequest.js';
import {
  INVALID_ACCOUNT_ID,
  MORE_INFANTS_THAN_ADULTS,
  NO_ADULT_TICKET,
  TOO_MANY_TICKETS
} from '../../src/pairtest/lib/Errors.js';
import { ADULT, CHILD, INFANT } from '../../src/pairtest/lib/Constants.js';

Chai.use(SinonChai);

describe('Ticket Service', () => {
  let testService;
  const sandbox = createSandbox();

  describe('purchase validation', () => {
    beforeEach(() => {
      testService = new TicketService();
    });

    it('should not throw an InvalidPurchaseException if account id is greater than 0', () => {
      const accountId = 1;

      expect(() => testService.purchaseTickets(accountId)).to.not.throw(InvalidPurchaseException);
    });

    it('should throw an InvalidPurchaseException with correct message if account id is 0', () => {
      const accountId = 0;

      expect(() => testService.purchaseTickets(accountId)).to.throw(INVALID_ACCOUNT_ID);
    });

    it('should throw an InvalidPurchaseException with correct message if account id is less than 0', () => {
      const accountId = -1;

      expect(() => testService.purchaseTickets(accountId)).to.throw(INVALID_ACCOUNT_ID);
    });

    it('should throw an InvalidPurchaseException with correct message if more than 20 tickets are requested', () => {
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest(ADULT, 21);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequest)).to.throw(TOO_MANY_TICKETS);
    });

    it('should throw an InvalidPurchaseException with correct message if more than 20 tickets are requested across multiple ticket requests', () => {
      const accountId = 1;
      const ticketTypeRequestAdult = new TicketTypeRequest(ADULT, 10);
      const ticketTypeRequestChild = new TicketTypeRequest(CHILD, 11);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequestAdult, ticketTypeRequestChild)).to.throw(TOO_MANY_TICKETS);
    });

    it('should not throw an InvalidPurchaseException if 20 tickets are requested across multiple ticket requests', () => {
      const accountId = 1;
      const ticketTypeRequestAdult = new TicketTypeRequest(ADULT, 10);
      const ticketTypeRequestChild = new TicketTypeRequest(CHILD, 10);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequestAdult, ticketTypeRequestChild)).to.not.throw(InvalidPurchaseException);
    });

    it('should not throw an InvalidPurchaseException if less than 20 tickets are requested', () => {
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest(ADULT, 10);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequest)).to.not.throw(InvalidPurchaseException);
    });

    it('should throw an InvalidPurchaseException with correct message if a child ticket is purchased without an adult ticket', () => {
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest(CHILD, 1);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequest)).to.throw(NO_ADULT_TICKET);
    });

    it('should throw an InvalidPurchaseException with correct message if an infant ticket is purchased without an adult ticket', () => {
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest(INFANT, 1);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequest)).to.throw(NO_ADULT_TICKET);
    });

    it('should not throw an InvalidPurchaseException if an infant ticket is purchased with an adult ticket', () => {
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest(INFANT, 1);
      const ticketTypeRequestAdult = new TicketTypeRequest(ADULT, 1);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequest, ticketTypeRequestAdult)).to.not.throw(InvalidPurchaseException);
    });

    it('should not throw an InvalidPurchaseException if a child ticket is purchased with an adult ticket', () => {
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest(CHILD, 1);
      const ticketTypeRequestAdult = new TicketTypeRequest(ADULT, 1);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequest, ticketTypeRequestAdult)).to.not.throw(InvalidPurchaseException);
    });

    it('should throw an InvalidPurchaseException with correct message if more infant tickets are purchased than adult tickets', () => {
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest(INFANT, 2);
      const ticketTypeRequestAdult = new TicketTypeRequest(ADULT, 1);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequest, ticketTypeRequestAdult)).to.throw(MORE_INFANTS_THAN_ADULTS);
    });

    it('should not throw an InvalidPurchaseException if the same number of infant tickets are purchased as number of adult tickets', () => {
      const accountId = 1;
      const ticketTypeRequest = new TicketTypeRequest(INFANT, 2);
      const ticketTypeRequestAdult = new TicketTypeRequest(ADULT, 2);

      expect(() => testService.purchaseTickets(accountId, ticketTypeRequest, ticketTypeRequestAdult)).to.not.throw(MORE_INFANTS_THAN_ADULTS);
    });
  });

  describe('Payments and reservations', () => {
    let reserveSeatStub;
    let makePaymentStub;
    let infoStub;

    const accountId = 1;

    beforeEach(() => {
      reserveSeatStub = sandbox.stub();
      makePaymentStub = sandbox.stub();
      infoStub = sandbox.stub();

      const mockSeatBookingService = {
        reserveSeat: reserveSeatStub,
      }

      const mockPaymentService = {
        makePayment: makePaymentStub,
      }

      const loggerStub = {
        info: infoStub,
      }

      testService = new TicketService(mockSeatBookingService, mockPaymentService, loggerStub);
    });

    describe('Seat reservations', () => {
      it('should reserve 1 seat for 1 adult', () => {
        const ticketTypeRequest = new TicketTypeRequest(ADULT, 1);
        const expectedNumberOfSeats = 1;

        testService.purchaseTickets(accountId, ticketTypeRequest);
        expect(reserveSeatStub).to.have.been.calledWith(accountId, expectedNumberOfSeats);
        expect(infoStub).to.have.been.calledWith('Reserving 1 seat(s) with account ID: 1');
      });

      it('should reserve 2 seats for 1 adult and 1 child', () => {
        const ticketTypeRequest = new TicketTypeRequest(ADULT, 1);
        const ticketTypeRequestChild = new TicketTypeRequest(CHILD, 1);
        const expectedNumberOfSeats = 2;

        testService.purchaseTickets(accountId, ticketTypeRequest, ticketTypeRequestChild);
        expect(reserveSeatStub).to.have.been.calledWith(accountId, expectedNumberOfSeats);
        expect(infoStub).to.have.been.calledWith('Reserving 2 seat(s) with account ID: 1');
      });

      it('should reserve 10 seats for 5 adults, 5 children, and 5 infants', () => {
        const ticketTypeRequest = new TicketTypeRequest(ADULT, 5);
        const ticketTypeRequestChild = new TicketTypeRequest(CHILD, 5);
        const ticketTypeRequestInfant = new TicketTypeRequest(INFANT, 5);
        const expectedNumberOfSeats = 10;

        testService.purchaseTickets(accountId,
          ticketTypeRequest,
          ticketTypeRequestChild,
          ticketTypeRequestInfant);
        expect(reserveSeatStub).to.have.been.calledWith(accountId, expectedNumberOfSeats);
        expect(infoStub).to.have.been.calledWith('Reserving 10 seat(s) with account ID: 1');
      });
    });

    describe('Payments', () => {
      it('should charge 20 for a single adult ticket', () => {
        const ticketTypeRequest = new TicketTypeRequest(ADULT, 1);
        testService.purchaseTickets(accountId, ticketTypeRequest);
        const expectedAmount = 20;

        expect(makePaymentStub).to.have.been.calledOnceWith(1, expectedAmount);
        expect(infoStub).to.have.been.calledWith('Making payment of £20.00 with account ID: 1')
      });

      it('should charge 50 for a 2x adult tickets and 1x child ticket', () => {
        const ticketTypeRequest = new TicketTypeRequest(ADULT, 2);
        const ticketTypeRequestChild = new TicketTypeRequest(CHILD, 1);
        testService.purchaseTickets(accountId, ticketTypeRequest, ticketTypeRequestChild);
        const expectedAmount = 50;

        expect(makePaymentStub).to.have.been.calledOnceWith(1, expectedAmount);
        expect(infoStub).to.have.been.calledWith('Making payment of £50.00 with account ID: 1')
      });

      it('should charge 50 for a 2x adult tickets, 1x child ticket and 2x infant tickets', () => {
        const ticketTypeRequest = new TicketTypeRequest(ADULT, 2);
        const ticketTypeRequestChild = new TicketTypeRequest(CHILD, 1);
        const ticketTypeRequestInfant = new TicketTypeRequest(INFANT, 2);
        testService.purchaseTickets(accountId,
          ticketTypeRequest,
          ticketTypeRequestChild,
          ticketTypeRequestInfant);
        const expectedAmount = 50;

        expect(makePaymentStub).to.have.been.calledOnceWith(1, expectedAmount);
        expect(infoStub).to.have.been.calledWith('Making payment of £50.00 with account ID: 1')
      });
    });
  });
});
