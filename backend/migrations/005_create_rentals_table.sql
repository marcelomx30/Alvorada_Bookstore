CREATE TABLE rentals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  due_date DATE NOT NULL,
  rented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  returned_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK(status IN('active', 'returned', 'overdue')), 
  rented_by_admin_id INTEGER REFERENCES users(id),
  notes TEXT
);

CREATE INDEX idx_rentals_user_id ON rentals(user_id);
CREATE INDEX idx_rentals_book_id ON rentals(book_id);
CREATE INDEX idx_rentals_status ON rentals(status);
