import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from './AuthSystem';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Loader2, Save, User as UserIcon, MapPin, Phone, Mail, Award } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileViewProps {
    user: User;
}

interface ProfileData {
    id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number: string | null;
    bio: string | null;
    avatar_url: string | null;
    location: string | null;
    skills: string[] | null;
}

export function ProfileView({ user }: ProfileViewProps) {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [skillsInput, setSkillsInput] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [user.id]);

    async function fetchProfile() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setProfile(data);
                setFullName(data.full_name || '');
                setPhoneNumber(data.phone_number || '');
                setBio(data.bio || '');
                setLocation(data.location || '');
                setAvatarUrl(data.avatar_url || '');
                setSkillsInput(data.skills ? data.skills.join(', ') : '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            const updates: any = {
                full_name: fullName,
                phone_number: phoneNumber,
                bio: bio,
                location: location,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            if (user.role === 'volunteer') {
                updates.skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profile updated successfully');
            fetchProfile(); // Refresh data
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8">

                {/* Left Column: Avatar & Basic Info Card */}
                <div className="w-full md:w-1/3 space-y-6">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto relative">
                                <Avatar className="h-32 w-32 border-4 border-background shadow-xl mb-4">
                                    <AvatarImage src={avatarUrl} alt={fullName} />
                                    <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                        {fullName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle>{fullName}</CardTitle>
                            <CardDescription className="capitalize badge badge-outline mt-2 inline-flex items-center px-2 py-1 rounded-full bg-muted text-xs">
                                {user.role}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 mr-2" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            {phoneNumber && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4 mr-2" />
                                    <span>{phoneNumber}</span>
                                </div>
                            )}
                            {location && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    <span>{location}</span>
                                </div>
                            )}
                            {profile?.skills && profile.skills.length > 0 && (
                                <div className="pt-4 border-t">
                                    <p className="text-xs font-semibold mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-1">
                                        {profile.skills.map((skill, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Edit Form */}
                <div className="w-full md:w-2/3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Profile</CardTitle>
                            <CardDescription>
                                Update your personal information and profile settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location / Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="pl-9"
                                            placeholder="City, Country"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us a bit about yourself..."
                                        className="h-24 resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="avatar">Avatar URL</Label>
                                    <Input
                                        id="avatar"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        placeholder="https://example.com/avatar.jpg"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Link to an image for your profile picture.
                                    </p>
                                </div>

                                {user.role === 'volunteer' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="skills">Skills (comma separated)</Label>
                                        <Input
                                            id="skills"
                                            value={skillsInput}
                                            onChange={(e) => setSkillsInput(e.target.value)}
                                            placeholder="First Aid, Driving, Search & Rescue"
                                        />
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" disabled={saving} className="min-w-[120px]">
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
