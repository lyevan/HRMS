import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import useToastStore from "../store/toastStore";

const RFIDModal = ({ employee, isModalOpen, setIsModalOpen }) => {
  const [counter, setCounter] = useState(30);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const intervalRef = useRef(null);

  const { showToast } = useToastStore();

  // Cleanup interval when modal closes
  useEffect(() => {
    if (!isModalOpen && intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsEnrolling(false);
      setCounter(30);
    }
  }, [isModalOpen]);

  const deleteRFID = async (employee_id, rfid) => {
    const result = await axios.delete("/rfid", { data: { employee_id, rfid } });
    if (result.data.success) {
      showToast("RFID deleted successfully.", "success");
      setIsModalOpen(!isModalOpen);
    }
  };

  const handleRFID = async (employee_id, rfid) => {
    if (!rfid) {
      // Handle case when RFID is not set
      const result = await axios.post("/rfid", {
        employee_id,
      });
      if (result.data.success) {
        startCountdown();
      }
    }
  };

  const doesRFIDExist = async (employee_id) => {
    const result = await axios.post(`/employees/get-employee`, {
      employee_id: employee_id,
    });
    return result.data.data.rfid ? true : false;
  };
  const startCountdown = () => {
    if (!isEnrolling) {
      setIsEnrolling(true);
      setCounter(30); // Reset counter

      intervalRef.current = setInterval(async () => {
        setCounter((prevCounter) => {
          const newCounter = prevCounter - 1;

          // Check every 3 seconds for RFID enrollment
          if (newCounter % 3 === 0 && newCounter > 0) {
            doesRFIDExist(employee.employee_id).then((exists) => {
              if (exists) {
                clearInterval(intervalRef.current);
                setIsEnrolling(false);
                setCounter(30);
                setIsModalOpen(false);
                showToast("RFID enrolled successfully.", `success`);
              }
            });
          }

          // Stop when counter reaches 0
          if (newCounter === 0) {
            clearInterval(intervalRef.current);
            setIsEnrolling(false);
            setCounter(30);
          }

          // Update the countdown display
          const counterElement = document.getElementById("counterElement");
          if (counterElement) {
            counterElement.style.setProperty("--value", newCounter);
          }

          return newCounter;
        });
      }, 1000);
    }
  };

  return (
    <dialog className={`modal ${isModalOpen ? "modal-open" : ""}`}>
      {employee.rfid ? (
        <div className="modal-box shadow-none outline-2 outline-neutral">
          <h3 className="font-bold text-lg">Want to update RFID?</h3>
          <p className="py-4">This employee has an RFID assigned.</p>
          <p className="py-4">Employee ID: {employee.employee_id}</p>
          <p className="py-4">{employee.rfid}</p>
          <div className="modal-action">
            <form method="dialog" className="space-x-4">
              <button
                className="btn btn-info"
                onClick={() => {
                  deleteRFID(employee.employee_id, employee.rfid);
                }}
              >
                Delete
              </button>
              <button
                className="btn btn-error"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="modal-box shadow-none outline-2 outline-neutral">
          <h3 className="font-bold text-lg">Enroll now?</h3>
          <p className="py-4">This employee does not have an RFID assigned.</p>
          <p className="py-4">Employee ID: {employee.employee_id}</p>{" "}
          <div>
            <span className="countdown font-mono text-6xl">
              <span
                id="counterElement"
                style={{ "--value": counter }}
                aria-live="polite"
                aria-label={counter}
              >
                {counter}
              </span>
            </span>
          </div>
          <div className="modal-action">
            <form className="space-x-4" method="dialog">
              <button
                className="btn btn-info"
                disabled={isEnrolling}
                onClick={() => {
                  handleRFID(employee.employee_id, employee.rfid);
                }}
              >
                {isEnrolling ? "Enrolling..." : "Enroll"}
              </button>
              <button
                className="btn btn-error"
                disabled={isEnrolling}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}
    </dialog>
  );
};

export default RFIDModal;
