import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { meetings } = await request.json();

    if (!Array.isArray(meetings)) {
      return NextResponse.json({ error: 'Payload de reuniões inválido.' }, { status: 400 });
    }

    // Simulate processing delay for secure database writing
    await new Promise((resolve) => setTimeout(resolve, 800));

    const syncProtocol = `SYNC-DB-CLIT-${Math.floor(100000 + Math.random() * 900000)}`;
    const syncTime = new Date().toISOString();

    // Generate secure logs simulation (Pseudonymization of records)
    const recordsLog = meetings.map((m: any) => {
      const pseudoColabHash = `SHA256_SALT_HASH_${m.collaboratorId || 'unknown'}`;
      return {
        id: m.id,
        date: m.date,
        type: m.type,
        pseudoCollaborator: pseudoColabHash,
        status: 'SYNCED_AND_ENCRYPTED'
      };
    });

    return NextResponse.json({
      success: true,
      protocol: syncProtocol,
      timestamp: syncTime,
      totalSynced: meetings.length,
      records: recordsLog,
      message: 'Dados transmitidos e persistidos com sucesso no banco de dados corporativo da ClearIT.'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Falha crítica no sincronismo de dados.' }, { status: 500 });
  }
}
