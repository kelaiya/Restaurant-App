class Table {
    constructor(id, capacity) {
        this.id = id;
        this.capacity = capacity;
        this.bookings = new Map();
        this.totalBookings = 0;
    }
}

class Booking {
    constructor(id, tableId, customerEmail, startTime, endTime, partySize) {
        this.id = id;
        this.tableId = tableId;
        this.customerEmail = customerEmail;
        this.startTime = startTime;
        this.endTime = endTime;
        this.partySize = partySize;
        this.status = "active"; // active / cancelled
    }
}

class Customer {
    constructor(name, email) {
        this.name = name;
        this.email = email;
        this.bookings = new Set();
    }
}

class RestaurantSystem {
    constructor() {
        this.tables = new Map();
        this.bookings = new Map();
        this.customers = new Map();
        this.bookingCounter = 0;
        this.waitlist = [];
    }

    addTable(timestamp, tableId, capacity) {
        try { 
            if(this.tables.has(tableId)) return "false";
            this.tables.set(tableId, new Table(tableId, Number(capacity)));
            return "true";
        } catch(e) { return "false"; }
    }

    removeTable(tableId) {
        try {
            if(!this.tables.has(tableId)) return "false";
            this.tables.delete(tableId);
            return "Table removed";
        } catch(e) { return "Error in removing table"; }
    }

    registerCustomer(name, email) {
        try {
            if(this.customers.has(email)) return "false";
            this.customers.set(email, new Customer(name, email));
            return "You got registed!"
        } catch(e) { return "Register has some error"; }
    }

    bookTable(timestamp, customerEmail, partySize) {
        try {
            const { start, end } = this.getTimeSlot(timestamp, partySize);
            const table = this.findAvailableTable(timestamp, Number(partySize));
            if(!table) {
                this.waitlist.push({customerEmail, partySize, timestamp});
                return "Added to the waitlist";
            }
            ++this.bookingCounter;
            const bookingId = `B${this.bookingCounter}`;
            const booking = new Booking(bookingId, table.id, customerEmail, start, end, Number(partySize));
            this.bookings.set(bookingId, booking);
            table.bookings.set(bookingId, booking);
            table.totalBookings++;
            return bookingId;
        } catch(e) { 
            this.waitlist.push({customerEmail, partySize, timestamp})
            return "false";
         }
    }

    cancelBooking(bookingId) {
        try {
            const booking = this.bookings.get(bookingId);
            if(!booking || booking.status != "active") return "false";
            booking.status = "cancelled";
            const table = this.tables.get(booking.tableId);
            if(table) table.bookings.delete(bookingId);
            const newWaitlist = this.processWaitlist();
            var totalActiveBookings = [];
            for(const b of this.bookings.values()) {
                totalActiveBookings.push(`bookingId: ${b.id}, Name: ${b.customerEmail}, Time: ${b.startTime}pm`)
            }
            return `Active Bookings: ${totalActiveBookings}`;
        } catch(e) { return "Error in canceling booking"; }
    }

    findAvailableTable(timestamp, partySize) {
        const { start, end } = this.getTimeSlot(timestamp, partySize);
        let bestTable = null;
        for(const table of this.tables.values()) {
            if(table.capacity < partySize) continue;
            if(this.hasConflict(table, start, end)) {
                continue;
            }
            if(!bestTable || table.capacity < bestTable.capacity) {
                bestTable = table;
            }
        }
         return bestTable;
    }

    checkAvailability(timestamp, partySize) {
        try {
            const table = this.findAvailableTable(timestamp, partySize);
            return table ? `available: ${table.id}` : "unavailable";
        } catch(e) { return "false"; }
    }

    getCustomerHistory(email) {
        try {
            const customer = this.customers.get(email);
            if(!customer) return "Customer doesnt exist";
            return Array.from(customer.bookings)
            .map(bookingId => {
                const b = this.bookings.get(bookingId);
                return b ? `${b.id}(${b.tableId}, ${b.status})` : "";
            })    
        } catch(e) { return ""; }
    }

    checkUtilization(timestamp) {
        const time = Number(timestamp);
        let used = 0;
        let total = 0;
        for(const table of this.tables.values()) {
            total += table.capacity;
            let isUsed = false;
            for(const booking of table.bookings.values()) {
                if(booking.status != "active") conntinue;
                if(time >= booking.startTime && time < booking.endTime) {
                    isUsed = true;
                    break;
                }
            }
            if(isUsed) used += table.capacity;
        }
        return `${used}/${total}`;
    }

    canAccomodate(timestamp, partySize) {
        const { start, end } = this.getTimeSlot(timestamp, partySize);
        const availableTables = Array.from(this.tables.values())
        .filter(t => !this.hasConflict(t, start, end))
        .sort((a, b) => a.capacity - b.capacity);
        let sum = 0;
        for(const table of availableTables) {
            sum += table.capacity;
            if(sum >= partySize) return "true";
        }
        return "false";
    }

    rescheduleBooking(bookingId, newTimestamp) {
    try {
        const booking = this.bookings.get(bookingId);
        if (!booking || booking.status !== "active") return "false";
        const newTable = this.findAvailableTable(newTimestamp, Number(booking.partySize));
        if (!newTable) return "Can't reschedule";
        const { start, end } = this.getTimeSlot(newTimestamp, Number(booking.partySize))
        booking.tableId = newTable.id;
        booking.startTime = start;
        booking.endTime = end;
        return "true";
    } catch (e) { return "false"; }
}

    getBookingDuration(partySize) {
        return partySize > 6 ? 3 : 2;
    }

    getTimeSlot(timestamp, partySize) {
        const start = Number(timestamp);
        const duration = this.getBookingDuration(partySize);
        const end = start + duration;
        return { start, end };
    }

    hasConflict(table, start, end) {
        for(const booking of table.bookings.values()) {
            if(booking.status != "active") continue;
            const existingStart = booking.startTime;
            const existingEnd = booking.endTime;
            if(!(end <= existingStart || start >= existingEnd)) return true;
        }
        return false;
    }

    processWaitlist() {
        for(let i = 0; i < this.waitlist.length; i++) {
            const req = this.waitlist[i];
            const table = this.findAvailableTable(req.timestamp, req.partySize);
            if(table) {
                this.bookingCounter++;
                const bookingId = `B${this.bookingCounter}`;
                const { start, end } = this.getTimeSlot(req.timestamp, req.partySize);
                const booking = new Booking(bookingId, table.id, req.customerEmail, start, end, req.partySize);
                table.bookings.set(bookingId, booking);
                this.bookings.set(bookingId, booking);
                this.waitlist.splice(i, 1);
                i--;
            }
        }
        return "true";
    }
}

function solution(queries){
    const system = new RestaurantSystem();
    const results = [];
    for(const query of queries){
        const op = query[0];
        switch(op){
            case "ADD_TABLE":
                results.push(
                    system.addTable(query[1], query[2], query[3])
                );
                break;
            case "BOOK_TABLE":
                results.push(
                    system.bookTable(query[1], query[2], query[3])
                );
                break;
            case "CANCEL_BOOKING":
                results.push(
                    system.cancelBooking(query[1])
                );
                break;
            case "RESCHEDULE_BOOKING":
                results.push(
                    system.rescheduleBooking(query[1], query[2])
                );
                break;
            case "CHECK_UTILIZATION":
                results.push(
                    system.checkUtilization(query[1])
                );
                break;
            default:
                results.push("");
        }
    }
    return results;
}
const queries = [
  // ---------- TABLE SETUP ----------
  ["ADD_TABLE", "1", "T1", "2"],
  ["ADD_TABLE", "2", "T2", "4"],
  ["ADD_TABLE", "3", "T3", "6"],

  // ---------- BASIC BOOKINGS ----------
  ["BOOK_TABLE", "10", "Alice", "2"],   // should take T1
  ["BOOK_TABLE", "10", "Bob", "4"],     // should take T2
  ["BOOK_TABLE", "10", "Charlie", "6"], // should take T3

//   // ---------- OVERLAP TEST ----------
  ["BOOK_TABLE", "11", "David", "2"],   // ❌ overlap (10–12 vs 11–13)

//   // ---------- UTILIZATION ----------
  ["CHECK_UTILIZATION", "11"],          // should show full capacity used

//   // ---------- FUTURE BOOKING ----------
  ["BOOK_TABLE", "12", "Eve", "2"],    // ✅ allowed (no overlap)

//   // ---------- RESCHEDULE ----------
  ["RESCHEDULE_BOOKING", "B1", "13"],   // move Alice → later slot

//   // ---------- CANCEL ----------
  ["CANCEL_BOOKING", "B2"],            // cancel Bob

//   // ---------- WAITLIST TRIGGER ----------
  ["BOOK_TABLE", "10", "Frank", "4"],   // should go to waitlist (no table)

//   // ---------- WAITLIST AUTO ASSIGN ----------
  ["CANCEL_BOOKING", "B3"],             // frees table → assign Frank

//   // ---------- FINAL UTILIZATION ----------
  ["CHECK_UTILIZATION", "10"]
];
console.log(solution(queries));
