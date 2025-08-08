import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  FileUser,
  BookUser,
  Siren,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import axios from "axios";
import {
  BasicInfoForm,
  ContactInfoForm,
  EducationInfoForm,
  FamilyBackgroundForm,
  EmergencyContactForm,
} from "../components/forms/RegistrationForms";
import useToastStore from "../store/toastStore";
import ThemeSwitcher from "../components/ThemeSwitcher";

const Registration = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    nickname: "",
    gender: "",
    birthDate: "",
    birthPlace: "",
    civilStatus: "",
    nationality: "",
    religion: "",

    // Contact Info
    email: "",
    phone: "",
    alternatePhone: "",
    presentAddress: "",
    permanentAddress: "",
    sssNumber: "",
    pagibigNumber: "",
    philhealthNumber: "",
    tinNumber: "",

    // Education Info
    highestEducation: "",
    schoolName: "",
    courseOrMajor: "",
    graduationYear: null,

    // Family Background
    spouseName: "",
    spouseOccupation: "",
    fatherName: "",
    motherName: "",

    // Emergency Contact
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    emergencyContactAddress: "",

    // Employment Info (from token)
    department: "",
    position: "",
    hourlyRate: "",
    hireDate: "",
  });

  const steps = [
    {
      id: 0,
      title: "Basic Info",
      icon: FileUser,
      component: BasicInfoForm,
      fields: ["firstName", "lastName", "gender", "birthDate", "civilStatus"],
    },
    {
      id: 1,
      title: "Contact Info",
      icon: BookUser,
      component: ContactInfoForm,
      fields: ["email", "phone", "presentAddress"],
    },
    {
      id: 2,
      title: "Education",
      icon: GraduationCap,
      component: EducationInfoForm,
      fields: ["highestEducation", "schoolName"],
    },
    {
      id: 3,
      title: "Family Background",
      icon: Users,
      component: FamilyBackgroundForm,
      fields: ["fatherName", "motherName"],
    },
    {
      id: 4,
      title: "Emergency Contact",
      icon: Siren,
      component: EmergencyContactForm,
      fields: ["emergencyContactName", "emergencyContactPhone"],
    },
  ];
  // Load employment data from token (backend middleware handles verification)
  useEffect(() => {
    const loadEmploymentData = async () => {
      try {
        const result = await axios.get(
          `/invite/complete-registration/${token}`
        );
        if (result.data?.employmentData) {
          const empData = result.data.employmentData;
          setFormData((prev) => ({
            ...prev,
            email: empData.email || "",
            phone: empData.phone || "",
            department: empData.department || "",
            position: empData.position || "",
            hourlyRate: empData.hourly_rate || "",
            hireDate: empData.hire_date || "",
          }));
        }
      } catch (error) {
        console.error("Error loading employment data:", error);
        showToast("Failed to load registration data", "error");
        navigate("/unauthorized");
      }
    };

    if (token) {
      loadEmploymentData();
    }
  }, [token, navigate, showToast]);

  // Validate current step
  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    return step.fields.every((field) => {
      const value = formData[field];
      return value && value.trim() !== "";
    });
  };

  // Handle form data update
  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      showToast("Please fill in all required fields", "warning");
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle step click
  const handleStepClick = (stepIndex) => {
    // Can only go to completed steps or next immediate step
    if (
      completedSteps.has(stepIndex) ||
      stepIndex === currentStep ||
      (stepIndex === currentStep + 1 && validateStep(currentStep))
    ) {
      if (stepIndex === currentStep + 1 && validateStep(currentStep)) {
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
      }
      setCurrentStep(stepIndex);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `/invite/complete-registration/${token}`,
        formData
      );
      setHasSubmitted(true);
      navigate("/registration-success");
      showToast("Registration completed successfully!", "success");
    } catch (error) {
      console.error("Registration error:", error);
      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Registration failed",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="absolute bottom-4 left-4">
        <ThemeSwitcher />
      </div>
      <div className="w-full md:max-w-5xl bg-base-200 rounded-lg md:overflow-auto">
        <div className="h-200 flex flex-col md:flex-row md:h-160">
          {/* Steps Sidebar */}
          <div className="hidden md:block lg:w-1/3 bg-base-200 p-6">
            <h2 className="text-2xl font-bold text-center mb-8">
              Complete Registration
            </h2>
            <ul className="steps steps-vertical">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = completedSteps.has(index);
                const isCurrent = currentStep === index;
                const isAccessible =
                  isCompleted ||
                  isCurrent ||
                  (index === currentStep + 1 && validateStep(currentStep));

                return (
                  <li
                    key={step.id}
                    className={`step ${
                      isCurrent
                        ? "step-primary cursor-pointer"
                        : isCompleted
                        ? "step-success cursor-pointer"
                        : isAccessible
                        ? "text-base-content cursor-pointer"
                        : "text-base-content/50 cursor-not-allowed"
                    }`}
                    onClick={() => isAccessible && handleStepClick(index)}
                  >
                    <span className="step-icon">
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </span>
                    {step.title}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Form Content */}
          <div className="md:w-2/3 p-6 max-h-full md:bg-base-300 overflow-auto">
            {/* Steps Indicator for Small Screen */}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-base-content mb-2">
                {steps[currentStep].title}
              </h3>
              <div className="text-sm text-base-content/70">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <div className="mb-6">
              <ul className="steps md:hidden">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = completedSteps.has(index);
                  const isCurrent = currentStep === index;
                  const isAccessible =
                    isCompleted ||
                    isCurrent ||
                    (index === currentStep + 1 && validateStep(currentStep));
                  return (
                    <li
                      key={step.id}
                      className={`step ${
                        isCurrent
                          ? "step-primary cursor-pointer"
                          : isCompleted
                          ? "step-success cursor-pointer"
                          : isAccessible
                          ? "text-base-content cursor-pointer"
                          : "text-base-content/50 cursor-not-allowed"
                      }`}
                    >
                      <span className="step-icon">
                        {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Progress Bar */}
            <div className="hidden md:block w-full bg-base-300 rounded-full h-2 mb-8">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              ></div>
            </div>

            {/* Current Step Form */}
            <div className="mb-8">
              <CurrentStepComponent
                formData={formData}
                updateFormData={updateFormData}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="btn btn-outline btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              {currentStep === steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting || !validateStep(currentStep) || hasSubmitted
                  }
                  className="btn btn-primary flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Complete Registration
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
