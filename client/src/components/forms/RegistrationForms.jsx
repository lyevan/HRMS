import React from "react";

export const BasicInfoForm = ({ formData, updateFormData }) => {
  const handleChange = (e) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">First Name *</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter first name"
            required
          />
        </div>

        {/* Last Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Last Name *</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter last name"
            required
          />
        </div>

        {/* Middle Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Middle Name</span>
          </label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter middle name"
          />
        </div>

        {/* Suffix */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Suffix</span>
          </label>
          <select
            name="suffix"
            value={formData.suffix}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="">Select suffix</option>
            <option value="Jr.">Jr.</option>
            <option value="Sr.">Sr.</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>

        {/* Nickname */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Nickname</span>
          </label>
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter nickname"
          />
        </div>

        {/* Gender */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Gender *</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Birth Date */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Birth Date *</span>
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className="input input-bordered w-full"
            required
          />
        </div>

        {/* Birth Place */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Birth Place</span>
          </label>
          <input
            type="text"
            name="birthPlace"
            value={formData.birthPlace}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter birth place"
          />
        </div>

        {/* Civil Status */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Civil Status *</span>
          </label>
          <select
            name="civilStatus"
            value={formData.civilStatus}
            onChange={handleChange}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select civil status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
          </select>
        </div>

        {/* Nationality */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Nationality</span>
          </label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter nationality"
          />
        </div>

        {/* Religion */}
        <div className="form-control md:col-span-2">
          <label className="label">
            <span className="label-text font-medium">Religion</span>
          </label>
          <input
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter religion"
          />
        </div>
      </div>
    </div>
  );
};

export const ContactInfoForm = ({ formData, updateFormData }) => {
  const handleChange = (e) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Email Address *</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter email address"
            required
          />
        </div>

        {/* Phone */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Phone Number *</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter phone number"
            required
          />
        </div>

        {/* Alternate Phone */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Alternate Phone</span>
          </label>
          <input
            type="tel"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter alternate phone"
          />
        </div>

        {/* SSS Number */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">SSS Number</span>
          </label>
          <input
            type="text"
            name="sssNumber"
            value={formData.sssNumber}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter SSS number"
          />
        </div>

        {/* Pag-IBIG Number */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Pag-IBIG Number</span>
          </label>
          <input
            type="text"
            name="pagibigNumber"
            value={formData.pagibigNumber}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter Pag-IBIG number"
          />
        </div>

        {/* PhilHealth Number */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">PhilHealth Number</span>
          </label>
          <input
            type="text"
            name="philhealthNumber"
            value={formData.philhealthNumber}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter PhilHealth number"
          />
        </div>

        {/* TIN Number */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">TIN Number</span>
          </label>
          <input
            type="text"
            name="tinNumber"
            value={formData.tinNumber}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter TIN number"
          />
        </div>
      </div>

      {/* Present Address */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Present Address *</span>
        </label>
        <textarea
          name="presentAddress"
          value={formData.presentAddress}
          onChange={handleChange}
          className="textarea textarea-bordered w-full h-24"
          placeholder="Enter present address"
          required
        ></textarea>
      </div>

      {/* Permanent Address */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Permanent Address</span>
        </label>
        <textarea
          name="permanentAddress"
          value={formData.permanentAddress}
          onChange={handleChange}
          className="textarea textarea-bordered w-full h-24"
          placeholder="Enter permanent address"
        ></textarea>
        <label className="label">
          <span className="label-text-alt">
            <button
              type="button"
              className="link link-primary text-sm"
              onClick={() =>
                updateFormData({ permanentAddress: formData.presentAddress })
              }
            >
              Same as present address
            </button>
          </span>
        </label>
      </div>
    </div>
  );
};

export const EducationInfoForm = ({ formData, updateFormData }) => {
  const handleChange = (e) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Highest Education */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Highest Education *</span>
          </label>
          <select
            name="highestEducation"
            value={formData.highestEducation}
            onChange={handleChange}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select highest education</option>
            <option value="Elementary">Elementary</option>
            <option value="High School">High School</option>
            <option value="Vocational">Vocational</option>
            <option value="College">College</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="Doctorate">Doctorate</option>
          </select>
        </div>

        {/* School Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">School Name *</span>
          </label>
          <input
            type="text"
            name="schoolName"
            value={formData.schoolName}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter school name"
            required
          />
        </div>

        {/* Course or Major */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Course/Major</span>
          </label>
          <input
            type="text"
            name="courseOrMajor"
            value={formData.courseOrMajor}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter course or major"
          />
        </div>

        {/* Graduation Year */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Graduation Year</span>
          </label>
          <input
            type="number"
            name="graduationYear"
            value={formData.graduationYear}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter graduation year"
            min="1950"
            max={new Date().getFullYear() + 10}
          />
        </div>
      </div>
    </div>
  );
};

export const FamilyBackgroundForm = ({ formData, updateFormData }) => {
  const handleChange = (e) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Father's Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Father's Name *</span>
          </label>
          <input
            type="text"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter father's full name"
            required
          />
        </div>

        {/* Mother's Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Mother's Name *</span>
          </label>
          <input
            type="text"
            name="motherName"
            value={formData.motherName}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter mother's full name"
            required
          />
        </div>

        {/* Spouse Name (if applicable) */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Spouse Name</span>
          </label>
          <input
            type="text"
            name="spouseName"
            value={formData.spouseName}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter spouse name (if married)"
            disabled={formData.civilStatus === "Single"}
          />
        </div>

        {/* Spouse Occupation */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Spouse Occupation</span>
          </label>
          <input
            type="text"
            name="spouseOccupation"
            value={formData.spouseOccupation}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter spouse occupation"
            disabled={formData.civilStatus === "Single"}
          />
        </div>
      </div>
    </div>
  );
};

export const EmergencyContactForm = ({ formData, updateFormData }) => {
  const handleChange = (e) => {
    updateFormData({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emergency Contact Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">
              Emergency Contact Name *
            </span>
          </label>
          <input
            type="text"
            name="emergencyContactName"
            value={formData.emergencyContactName}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter emergency contact name"
            required
          />
        </div>

        {/* Emergency Contact Phone */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">
              Emergency Contact Phone *
            </span>
          </label>
          <input
            type="tel"
            name="emergencyContactPhone"
            value={formData.emergencyContactPhone}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Enter emergency contact phone"
            required
          />
        </div>

        {/* Emergency Contact Relationship */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Relationship</span>
          </label>
          <select
            name="emergencyContactRelationship"
            value={formData.emergencyContactRelationship}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="">Select relationship</option>
            <option value="Parent">Parent</option>
            <option value="Spouse">Spouse</option>
            <option value="Sibling">Sibling</option>
            <option value="Child">Child</option>
            <option value="Friend">Friend</option>
            <option value="Other Relative">Other Relative</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Emergency Contact Address */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">
            Emergency Contact Address
          </span>
        </label>
        <textarea
          name="emergencyContactAddress"
          value={formData.emergencyContactAddress}
          onChange={handleChange}
          className="textarea textarea-bordered w-full h-24"
          placeholder="Enter emergency contact address"
        ></textarea>
      </div>

      {/* Employment Information Summary */}
      <div className="mt-8 p-4 bg-base-300 rounded-lg">
        <h4 className="font-semibold text-lg mb-4">Employment Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Department:</span>{" "}
            {formData.department || "N/A"}
          </div>
          <div>
            <span className="font-medium">Position:</span>{" "}
            {formData.position || "N/A"}
          </div>
          <div>
            <span className="font-medium">Email:</span>{" "}
            {formData.email || "N/A"}
          </div>
          <div>
            <span className="font-medium">Phone:</span>{" "}
            {formData.phone || "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoForm;
