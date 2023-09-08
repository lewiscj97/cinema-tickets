import TicketTypeRequest from '../../dist/pairtest/lib/TicketTypeRequest.js';
import { NO_TICKETS_REQUESTED } from '../../dist/pairtest/lib/Errors.js';

export default (ticketService, req, res, log) => {
  try {
    const accountId = Number.parseInt(req.body.accountId) || 0;
    const ticketRequests = req.body?.tickets?.map((request) => new TicketTypeRequest(request.type, Number.parseInt(request.count)));
    if (!ticketRequests) {
      log.error(NO_TICKETS_REQUESTED);
      res.status(400);
      return res.send(NO_TICKETS_REQUESTED);
    }
    ticketService.purchaseTickets(accountId, ...ticketRequests);
    res.sendStatus(204);
  } catch ({ name, message }) {
    log.error(`${name}: ${message}`);
    res.status(400);
    res.send(message);
  }
}
