import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSidebar from "@/components/DashboardSidebar";
import ChatInterface from "@/components/ChatInterface";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "firebase-admin";
import { db } from "@/lib/firebaseClient";

export default function Profile() {
  const { user, userRole, switchRole } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");
  const [employment, setEmployment] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      // Use the correct Firestore instance
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFullName(data.fullName || "");
        setPhone(data.phone || "");
        setLocation(data.location || "");
        setBio(data.bio || "");
        setInterests(data.interests || "");
        setSkills(data.skills || "");
        setEducation(data.education || "");
        setEmployment(data.employment || "");
      }
    };

    fetchUserProfile();
  }, [user]);
  const handleSave = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          fullName,
          phone,
          location,
        },
        { merge: true }
      ); // Merge to only update specified fields without overwriting others

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };
  const handleUpdate = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          bio,
          interests,
          skills,
          education,
          employment,
        },
        { merge: true }
      ); // Merge to only update specified fields without overwriting others

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };
  return (
    <ProtectedRoute>
      <Head>
        <title>Profile | Astra</title>
        <meta name="description" content="Manage your profile" />
      </Head>

      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">
                  Your Profile
                </h1>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  68% Complete
                </Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center mb-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                          {user?.email?.charAt(0).toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        {/* <Input id="name" placeholder="Enter your full name" /> */}
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        {/* <Input
                          id="phone"
                          placeholder="Enter your phone number"
                        /> */}
                        <Input
                          id="phone"
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="location">Location</Label>
                        {/* <Input
                          id="location"
                          placeholder="City, State/Province, Country"
                        /> */}
                        <Input
                          id="location"
                          placeholder="City, State/Province, Country"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="ml-auto" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                      This information helps us match you with opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself"
                        className="min-h-[100px]"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="interests">Interests</Label>
                      <Input
                        id="interests"
                        placeholder="e.g. Education, Technology, Healthcare"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="skills">Skills</Label>
                      <Input
                        id="skills"
                        placeholder="e.g. Programming, Writing, Leadership"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="education">Education Level</Label>
                      <Input
                        id="education"
                        placeholder="e.g. Bachelor's Degree, High School"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="employment">Employment Status</Label>
                      <Input
                        id="employment"
                        placeholder="e.g. Employed, Student, Seeking Work"
                        value={employment}
                        onChange={(e) => setEmployment(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="ml-auto" onClick={handleUpdate}>
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Role Switcher Card - Only show for users with organization role */}
              {user?.role === "organization" && user?.kycVerified && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Type</CardTitle>
                    <CardDescription>
                      Switch between individual and organization views
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
                          <Label htmlFor="individual-mode">
                            Individual Mode
                          </Label>
                        </div>
                        <Switch
                          id="individual-mode"
                          checked={userRole === "individual"}
                          onCheckedChange={() => switchRole("individual")}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <Label htmlFor="organization-mode">
                            Organization Mode
                          </Label>
                        </div>
                        <Switch
                          id="organization-mode"
                          checked={userRole === "organization"}
                          onCheckedChange={() => switchRole("organization")}
                        />
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Current view:</strong>{" "}
                          {userRole === "organization"
                            ? `Organization (${
                                user?.organizationName || "Your Organization"
                              })`
                            : "Individual"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Profile Completion</CardTitle>
                  <CardDescription>
                    Complete your profile to improve opportunity matching
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Overall Completion
                        </span>
                        <span className="text-sm font-medium">68%</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { name: "Personal Information", progress: 80 },
                        { name: "Skills & Interests", progress: 60 },
                        { name: "Education History", progress: 40 },
                        { name: "Employment History", progress: 90 },
                      ].map((section, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">
                              {section.name}
                            </span>
                            <span className="text-sm font-medium">
                              {section.progress}%
                            </span>
                          </div>
                          <Progress value={section.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="w-96 h-full">
            <ChatInterface />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
