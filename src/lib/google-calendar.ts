/**
 * Google Calendar Integration Utility
 */

export function generateMockMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${part1}-${part2}-${part3}`;
}

interface CreateMeetEventParams {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmail: string;
  accessToken?: string;
}

export async function createGoogleMeetEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
  attendeeEmail,
  accessToken
}: CreateMeetEventParams) {
  // If no accessToken is provided, fallback to generating a simulated hangout link
  if (!accessToken) {
    console.log('[Google Calendar] OAuth access token not provided. Generating simulated Meet link.');
    return {
      meetLink: generateMockMeetLink(),
      eventId: `mock-evt-${Math.floor(Math.random() * 1000000)}`,
      simulated: true
    };
  }

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Sao_Paulo'
        },
        attendees: [
          { email: attendeeEmail }
        ],
        conferenceData: {
          createRequest: {
            requestId: `synchr-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Erro ao criar evento na Google Calendar API.');
    }

    const meetLink = data.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || generateMockMeetLink();

    return {
      meetLink,
      eventId: data.id,
      simulated: false
    };
  } catch (err: any) {
    console.error('[Google Calendar API Error]:', err);
    return {
      meetLink: generateMockMeetLink(),
      eventId: `fallback-evt-${Math.floor(Math.random() * 1000000)}`,
      simulated: true,
      error: err.message
    };
  }
}
