class Table {
    constructor(id, capacity) {
        this.id = id;
        this.capacity = capacity;
        this.bookings = new Map();
        this.totalBookings = 0;
    }
}

class Booking {
    constructor(id, tableId, customerName, timestamp, partySize) {
        this.id = id;
        this.tableId = tableId;
        this.customerName = customerName;
        this.timestamp = timestamp;
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
            const table = this.findAvailableTable(timestamp, Number(partySize));
            if(!table) return "false";
            const time = Number(timestamp);
            this.bookingCounter++;
            const bookingId = `B${this.bookingCounter}`;
            const booking = new Booking(bookingId, table.id, customerEmail, time, Number(partySize));
            this.bookings.set(bookingId, booking);
            table.bookings.set(time, booking);
            table.totalBookings++;
            return bookingId;
        } catch(e) { return "Table didn't get booked"; }
    }

    cancelBooking(bookingId) {
        try {
            const booking = this.bookings.get(bookingId);
            if(!booking || booking.status != "active") return "false";
            booking.status = "cancelled";
            const table = this.tables.get(booking.tableId);
            if(table) table.bookings.delete(booking.timestamp);
            return "Booking Cancelled";
        } catch(e) { return "Error in canceling booking"; }
    }

    findAvailableTable(timestamp, partySize) {
        const time = Number(timestamp);
        let bestTable = null;
        for(const table of this.tables.values()) {
            if(table.capacity < partySize) continue;
            if(table.bookings.has(time) && table.bookings.get(time).status == "active") {
                continue;
            }
            if(!bestTable || table.capacity < bestTable.capacity) {
                bestTable == table;
            }
            return bestTable;
        }
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
}