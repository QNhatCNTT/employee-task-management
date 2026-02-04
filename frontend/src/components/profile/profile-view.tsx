import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Profile } from '../../services/profile-service';
import { Mail, Phone, Building, Briefcase, Clock, Edit } from 'lucide-react';

interface ProfileViewProps {
  profile: Profile;
  onEdit: () => void;
}

export const ProfileView = ({ profile, onEdit }: ProfileViewProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Profile</CardTitle>
        <Button size="sm" onClick={onEdit} className="flex items-center gap-1">
          <Edit size={16} />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="text-gray-400" size={20} />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{profile.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Phone className="text-gray-400" size={20} />
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{profile.phone || 'Not set'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Building className="text-gray-400" size={20} />
          <div>
            <p className="text-sm text-gray-500">Department</p>
            <p className="font-medium">{profile.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Briefcase className="text-gray-400" size={20} />
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium">{profile.role}</p>
          </div>
        </div>

        {profile.schedule && (
          <div className="flex items-center gap-3">
            <Clock className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Schedule</p>
              <p className="font-medium">
                {profile.schedule.workDays.join(', ')}
              </p>
              <p className="text-sm text-gray-600">
                {profile.schedule.startTime} - {profile.schedule.endTime}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
