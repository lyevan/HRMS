import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  CreditCard,
  Camera,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
} from "lucide-react";

interface EmploymentData {
  pending_employee_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  contract_id?: number;
  status: string;
  token?: string;
}

interface FormData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  nickname: string;
  sex: string;
  dateOfBirth: string;
  civilStatus: string;
  citizenship: string;
  religion: string;

  // Contact Information
  email: string;
  phone: string;
  telephone: string;
  currentAddress: string;
  permanentAddress: string;

  // Government ID Numbers
  sssNumber: string;
  hdmfNumber: string;
  philHealthNumber: string;
  tinNumber: string;

  // Avatar
  avatar?: File;
  avatarPreview?: string;
}

interface StepValidation {
  isValid: boolean;
  errors: string[];
}

const CompleteRegistrationForm = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [employmentData, setEmploymentData] = useState<EmploymentData | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    nickname: "",
    sex: "",
    dateOfBirth: "",
    civilStatus: "single",
    citizenship: "Filipino",
    religion: "",

    // Contact Information
    email: "",
    phone: "",
    telephone: "",
    currentAddress: "",
    permanentAddress: "",

    // Government ID Numbers
    sssNumber: "",
    hdmfNumber: "",
    philHealthNumber: "",
    tinNumber: "",

    // Avatar
    avatarPreview: "",
  });

  const steps = [
    {
      id: 1,
      title: "Personal Information",
      description: "Basic personal details",
      icon: User,
    },
    {
      id: 2,
      title: "Contact & Government IDs",
      description: "Contact info and ID numbers",
      icon: CreditCard,
    },
    {
      id: 3,
      title: "Avatar & Review",
      description: "Upload photo and review",
      icon: Camera,
    },
  ];
  useEffect(() => {
    const fetchEmploymentData = async () => {
      if (!token) {
        toast.error("Invalid or missing token");
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/invite/employment-data/${token}`);
        const data = response.data.employmentData;

        setEmploymentData(data); // Pre-fill form with existing data
        setFormData((prev) => ({
          ...prev,
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          middleName: data.middle_name || "",
          email: data.email || "",
          phone: data.phone || "",
          sex: data.sex || "",
          dateOfBirth: data.date_of_birth || "",
          civilStatus: data.civil_status || "single",
          citizenship: data.citizenship || "Filipino",
          religion: data.religion || "",
          nickname: data.nickname || "",
          suffix: data.suffix || "",
          telephone: data.telephone || "",
          currentAddress: data.current_address || "",
          permanentAddress: data.permanent_address || "",
          // Government ID Numbers
          sssNumber: data.sss_number || "",
          hdmfNumber: data.hdmf_number || "",
          philHealthNumber: data.philhealth_number || "",
          tinNumber: data.tin_number || "",
          // Avatar
          avatarPreview: data.avatar_url || "",
        }));

        toast.success("Employment data loaded successfully");
      } catch (error: any) {
        console.error("Error fetching employment data:", error);
        toast.error(
          error.response?.data?.error || "Failed to load employment data"
        );
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchEmploymentData();
  }, [token, navigate]);
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        avatar: file,
        avatarPreview: URL.createObjectURL(file),
      }));
    }
  };
  const validateStep = (step: number): StepValidation => {
    const errors: string[] = [];

    // For step 3, validate all previous steps without recursion
    if (step === 3) {
      // Step 1 validations
      if (!formData.firstName.trim()) errors.push("First name is required");
      if (!formData.lastName.trim()) errors.push("Last name is required");
      if (!formData.sex) errors.push("Sex is required");
      if (!formData.civilStatus) errors.push("Civil status is required");

      // Step 2 validations
      if (!formData.email.trim()) errors.push("Email is required");
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.push("Email format is invalid");
      }
    } else {
      switch (step) {
        case 1: // Personal Information
          if (!formData.firstName.trim()) errors.push("First name is required");
          if (!formData.lastName.trim()) errors.push("Last name is required");
          if (!formData.sex) errors.push("Sex is required");
          if (!formData.civilStatus) errors.push("Civil status is required");
          break;

        case 2: // Contact & Government IDs
          if (!formData.email.trim()) errors.push("Email is required");
          if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.push("Email format is invalid");
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);
    if (validation.isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    } else {
      validation.errors.forEach((error) => toast.error(error));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!token) {
      toast.error("Invalid token");
      return;
    }

    // Validate all steps
    const validation = validateStep(3);
    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    if (!attestationChecked) {
      toast.error("Please confirm that all information is true and correct");
      return;
    }

    try {
      setSubmitting(true);
      setShowConfirmation(false);

      // Create FormData for multipart/form-data request
      const submitData = new FormData();

      // Add all form fields
      submitData.append("firstName", formData.firstName);
      submitData.append("middleName", formData.middleName);
      submitData.append("lastName", formData.lastName);
      submitData.append("suffix", formData.suffix);
      submitData.append("nickname", formData.nickname);
      submitData.append("sex", formData.sex);
      submitData.append("dateOfBirth", formData.dateOfBirth);
      submitData.append("civilStatus", formData.civilStatus);
      submitData.append("citizenship", formData.citizenship);
      submitData.append("religion", formData.religion);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("telephone", formData.telephone);
      submitData.append("currentAddress", formData.currentAddress);
      submitData.append("permanentAddress", formData.permanentAddress);

      // Add government ID numbers
      submitData.append("sssNumber", formData.sssNumber);
      submitData.append("hdmfNumber", formData.hdmfNumber);
      submitData.append("philHealthNumber", formData.philHealthNumber);
      submitData.append("tinNumber", formData.tinNumber);

      // Add avatar if selected
      if (formData.avatar) {
        submitData.append("avatar", formData.avatar);
      }

      await axios.post(`/invite/complete-registration/${token}`, submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        "Registration completed successfully! Please wait for review and approval."
      );
      navigate("/auth");
    } catch (error: any) {
      console.error("Error completing registration:", error);
      toast.error(
        error.response?.data?.error || "Failed to complete registration"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderPersonalInformationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold">Personal Information</h3>
        <p className="text-gray-600">
          Please fill in your basic personal details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="middleName">Middle Name</Label>
          <Input
            id="middleName"
            value={formData.middleName}
            onChange={(e) => handleInputChange("middleName", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="suffix">Suffix</Label>
          <Input
            id="suffix"
            value={formData.suffix}
            onChange={(e) => handleInputChange("suffix", e.target.value)}
            placeholder="Jr., Sr., III, etc."
          />
        </div>

        <div>
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={formData.nickname}
            onChange={(e) => handleInputChange("nickname", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="sex">Sex *</Label>
          <Select
            value={formData.sex}
            onValueChange={(value) => handleInputChange("sex", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="civilStatus">Civil Status *</Label>
          <Select
            value={formData.civilStatus}
            onValueChange={(value) => handleInputChange("civilStatus", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select civil status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
              <SelectItem value="separated">Separated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="citizenship">Citizenship</Label>
          <Input
            id="citizenship"
            value={formData.citizenship}
            onChange={(e) => handleInputChange("citizenship", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="religion" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Religion
        </Label>
        <Input
          id="religion"
          value={formData.religion}
          onChange={(e) => handleInputChange("religion", e.target.value)}
        />
      </div>
    </div>
  );

  const renderContactAndGovernmentIDStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold">Contact & Government IDs</h3>
        <p className="text-gray-600">
          Contact information and government ID numbers
        </p>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Contact Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              disabled
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="phone">Mobile Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+63 9XX XXX XXXX"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="telephone">Telephone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => handleInputChange("telephone", e.target.value)}
              placeholder="(02) XXX XXXX"
            />
          </div>
        </div>
      </div>

      {/* Government ID Numbers */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Government ID Numbers
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sssNumber">SSS Number</Label>
            <Input
              id="sssNumber"
              value={formData.sssNumber}
              onChange={(e) => handleInputChange("sssNumber", e.target.value)}
              placeholder="Enter SSS Number"
            />
          </div>

          <div>
            <Label htmlFor="hdmfNumber">HDMF/Pag-IBIG Number</Label>
            <Input
              id="hdmfNumber"
              value={formData.hdmfNumber}
              onChange={(e) => handleInputChange("hdmfNumber", e.target.value)}
              placeholder="Enter HDMF/PAGIBIG Number"
            />
          </div>

          <div>
            <Label htmlFor="philHealthNumber">PhilHealth Number</Label>
            <Input
              id="philHealthNumber"
              value={formData.philHealthNumber}
              onChange={(e) =>
                handleInputChange("philHealthNumber", e.target.value)
              }
              placeholder="Enter PhilHealth Number"
            />
          </div>

          <div>
            <Label htmlFor="tinNumber">TIN Number</Label>
            <Input
              id="tinNumber"
              value={formData.tinNumber}
              onChange={(e) => handleInputChange("tinNumber", e.target.value)}
              placeholder="Enter TIN Number"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Address Information
        </h4>

        <div className="space-y-4">
          <div>
            <Label htmlFor="currentAddress">Current Address</Label>
            <Textarea
              id="currentAddress"
              value={formData.currentAddress}
              onChange={(e) =>
                handleInputChange("currentAddress", e.target.value)
              }
              placeholder="Enter your current complete address"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="permanentAddress">Permanent Address</Label>
            <Textarea
              id="permanentAddress"
              value={formData.permanentAddress}
              onChange={(e) =>
                handleInputChange("permanentAddress", e.target.value)
              }
              placeholder="Enter your permanent complete address"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAvatarAndReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold">Avatar & Review</h3>
        <p className="text-gray-600">
          Upload your photo and review your information
        </p>
      </div>

      {/* Avatar Upload */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Profile Picture
        </h4>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
              {formData.avatarPreview ? (
                <img
                  src={formData.avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <Label htmlFor="avatar" className="cursor-pointer">
              <div className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                <Upload className="h-4 w-4" />
                <span>Upload Photo</span>
              </div>
            </Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-sm text-gray-500">
              Recommended: Square image, max 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Review Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Review Information</h4>

        <div className="bg-card p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Name:</strong>{" "}
              {`${formData.firstName} ${formData.middleName} ${formData.lastName} ${formData.suffix}`.trim()}
            </div>
            <div>
              <strong>Email:</strong> {formData.email}
            </div>
            <div>
              <strong>Phone:</strong> {formData.phone || "Not provided"}
            </div>
            <div>
              <strong>Sex:</strong> {formData.sex}
            </div>
            <div>
              <strong>Date of Birth:</strong>{" "}
              {formData.dateOfBirth || "Not provided"}
            </div>
            <div>
              <strong>Civil Status:</strong> {formData.civilStatus}
            </div>
          </div>

          {(formData.sssNumber ||
            formData.hdmfNumber ||
            formData.philHealthNumber ||
            formData.tinNumber) && (
            <div className="pt-2 border-t">
              <div className="text-sm font-medium mb-2">Government IDs:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {formData.sssNumber && (
                  <div>
                    <strong>SSS:</strong> {formData.sssNumber}
                  </div>
                )}
                {formData.hdmfNumber && (
                  <div>
                    <strong>HDMF:</strong> {formData.hdmfNumber}
                  </div>
                )}
                {formData.philHealthNumber && (
                  <div>
                    <strong>PhilHealth:</strong> {formData.philHealthNumber}
                  </div>
                )}
                {formData.tinNumber && (
                  <div>
                    <strong>TIN:</strong> {formData.tinNumber}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading employment data...</p>
        </div>
      </div>
    );
  }

  if (!employmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Token</CardTitle>
            <CardDescription>
              The registration link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Registration
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome {employmentData.first_name}! Please complete your employee
            information below.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Step {currentStep} of {steps.length}:{" "}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep - 1].description}
            </CardDescription>

            {/* Progress Bar */}
            <div className="mt-4">
              <Progress
                value={(currentStep / steps.length) * 100}
                className="h-2"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center ${
                      currentStep >= step.id ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    <step.icon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>{" "}
          <CardContent>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Step Content */}
              {currentStep === 1 && renderPersonalInformationStep()}
              {currentStep === 2 && renderContactAndGovernmentIDStep()}
              {currentStep === 3 && renderAvatarAndReviewStep()}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <div className="flex gap-2 flex-1">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/auth")}
                    className="ml-auto"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="flex gap-2">
                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Complete Registration
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>{" "}
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirm Registration
              </DialogTitle>
              <DialogDescription>
                Please review your information carefully before submitting your
                registration.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-background p-4 rounded-lg">
                <h4 className="font-medium mb-2">Summary of Information:</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Name:</strong>{" "}
                    {`${formData.firstName} ${formData.middleName} ${formData.lastName} ${formData.suffix}`.trim()}
                  </div>
                  <div>
                    <strong>Email:</strong> {formData.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {formData.phone || "Not provided"}
                  </div>
                  <div>
                    <strong>Sex:</strong> {formData.sex}
                  </div>
                  <div>
                    <strong>Civil Status:</strong> {formData.civilStatus}
                  </div>
                  {(formData.sssNumber ||
                    formData.hdmfNumber ||
                    formData.philHealthNumber ||
                    formData.tinNumber) && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="font-medium">Government IDs:</div>
                      {formData.sssNumber && (
                        <div>• SSS: {formData.sssNumber}</div>
                      )}
                      {formData.hdmfNumber && (
                        <div>• HDMF: {formData.hdmfNumber}</div>
                      )}
                      {formData.philHealthNumber && (
                        <div>• PhilHealth: {formData.philHealthNumber}</div>
                      )}
                      {formData.tinNumber && (
                        <div>• TIN: {formData.tinNumber}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="attestation"
                  checked={attestationChecked}
                  onCheckedChange={(checked) =>
                    setAttestationChecked(checked === true)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="attestation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I attest that all information provided is true and correct
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    I understand that providing false information may result in
                    disqualification or termination of employment. I also
                    acknowledge that this information will be used for
                    employment purposes and may be verified by the company.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setAttestationChecked(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmSubmit}
                disabled={!attestationChecked || submitting}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Submit Registration
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CompleteRegistrationForm;
