import React, { useState } from 'react';
import { Link } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';

const Details = () => {
  // Sample data - you can replace this with props or API data
  const [invoiceData] = useState({
    invoiceNumber: 'INV-2024-001',
    customerName: 'Arancist',
    transactionDate: '2024-08-27',
    items: [
      { id: 1, name: 'Product A', quantity: 2, price: 2500.00 },
      { id: 2, name: 'Product B', quantity: 1, price: 3750.00 },
      { id: 3, name: 'Product C', quantity: 3, price: 1500.00 },
    ],
    discount: 500.00,
    amountReceived: 12500.00
  });

  // Calculate totals
  const calculateItemTotal = (quantity, price) => {
    return (quantity * price).toFixed(2);
  };

  const calculateSubTotal = () => {
    return invoiceData.items.reduce((acc, item) => {
      return acc + (item.quantity * item.price);
    }, 0).toFixed(2);
  };

  const calculateAmountDue = () => {
    const subTotal = parseFloat(calculateSubTotal());
    const discount = invoiceData.discount || 0;
    return (subTotal - discount).toFixed(2);
  };

  const calculateChange = () => {
    const amountDue = parseFloat(calculateAmountDue());
    const amountReceived = invoiceData.amountReceived || 0;
    return (amountReceived - amountDue).toFixed(2);
  };

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="container py-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Link to="/admin/logs" className="btn btn-outline-primary">
                <i className="bi bi-arrow-left"></i> Back
              </Link>
              <h2 className="mb-0">Invoice Details</h2>
              <div></div> {/* Empty div for spacing */}
            </div>
            
            <div className="row">
              {/*Invoice Items Table*/}
              <div className="col-lg-8 col-md-7 mb-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Invoice #{invoiceData.invoiceNumber}</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" className="text-start">#</th>
                            <th scope="col" className="text-start">Item Name</th>
                            <th scope="col" className="text-start">Quantity</th>
                            <th scope="col" className="text-start">Price</th>
                            <th scope="col" className="text-start">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceData.items.map((item, index) => (
                            <tr key={item.id}>
                              <th scope="row">{index + 1}</th>
                              <td>{item.name}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end">₱{item.price.toFixed(2)}</td>
                              <td className="text-end fw-bold">
                                ₱{calculateItemTotal(item.quantity, item.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/*Transaction Details Card*/}
              <div className="col-lg-4 col-md-5 mb-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">Transaction Details</h5>
                  </div>
                  <div className="card-body">
                      <table className="table table-borderless table-sm mb-0">
                      <tbody>
                          <tr>
                          <td className="fw-bold">Customer Name:</td>
                          <td>{invoiceData.customerName}</td>
                          </tr>
                          <tr>
                          <td className="fw-bold">Date of Transaction:</td>
                          <td>{invoiceData.transactionDate}</td>
                          </tr>
                          <tr>
                          <td className="fw-bold">Sub Total:</td>
                          <td>₱{calculateSubTotal()}</td>
                          </tr>
                          <tr>
                          <td className="fw-bold">Discount:</td>
                          <td>{invoiceData.discount ? `₱${invoiceData.discount.toFixed(2)}` : '-'}</td>
                          </tr>
                          <tr>
                          <td className="fw-bold">Amount Due:</td>
                          <td>₱{calculateAmountDue()}</td>
                          </tr>
                          <tr>
                          <td className="fw-bold">Amount Received:</td>
                          <td>₱{invoiceData.amountReceived.toFixed(2)}</td>
                          </tr>
                          <tr>
                          <td className="fw-bold">Change:</td>
                          <td className={parseFloat(calculateChange()) >= 0 ? 'text-success' : 'text-danger'}>
                              ₱{calculateChange()}
                          </td>
                          </tr>
                      </tbody>
                      </table>
                  </div>
                  <div className="card-footer text-muted text-center bg-light border-0">
                    <small>Generated on {new Date().toLocaleDateString()}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;